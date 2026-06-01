from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from collections import deque
from datetime import datetime
from typing import Optional
import threading
import time
import psutil

# ===== BASE DIZIN =====
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI()

TASK_TIMEOUT_SEC = 300  # daha kısa tuttuk (60sn)

# ===== MODEL =====
class TaskRequest(BaseModel):
    device_id: Optional[str] = None
    device: Optional[str] = None
    task_name: Optional[str] = None
    task: Optional[str] = None
    temperature: float = 0.0
    humidity: float = 0.0
    value: int = 0
    timestamp: str = ""

    def get_device_id(self):
        return (self.device_id or self.device or "unknown").lower()

    def get_task_name(self):
        raw = (self.task_name or self.task or "normal").upper()
        mapping = {
            "SERVO_ON": "fan_ac",
            "BUZZER_ON": "buzzer_on",
            "NORMAL": "normal_izle",
            "FAN_AC": "fan_ac",
            "BUZZER_AC": "buzzer_on",
            "LAPTOP_AC": "laptop_ac",
        }
        return mapping.get(raw, raw.lower())

# ===== GLOBAL DURUM =====
task_queue = deque()
completed_tasks = []
current_task = None
queue_lock = threading.Lock()

esp1_latest = {"task_name": "bekleniyor", "temperature": 0, "received_at": ""}
esp2_latest = {"task_name": "bekleniyor", "value": 0, "received_at": ""}

# ===== FIFO SCHEDULER =====
def fifo_scheduler():
    global current_task

    while True:
        with queue_lock:

            # WATCHDOG
            if current_task is not None:
                elapsed = time.time() - current_task.get("_started_ts", time.time())
                if elapsed > TASK_TIMEOUT_SEC:
                    print(f"[WATCHDOG] Timeout -> {current_task['task_name']}")
                    current_task["status"] = "timeout"
                    current_task["finished_at"] = datetime.now().strftime("%H:%M:%S")
                    completed_tasks.append(current_task.copy())
                    current_task = None

            # FIFO başlat
            if current_task is None and task_queue:
                task = task_queue.popleft()
                task["status"] = "running"
                task["started_at"] = datetime.now().strftime("%H:%M:%S")
                task["_started_ts"] = time.time()
                current_task = task

                print(f"[FIFO] BASLADI -> {task['task_name']} ({task['device_id']})")

        time.sleep(0.1)

threading.Thread(target=fifo_scheduler, daemon=True).start()

# ===== ENDPOINTLER =====

@app.get("/")
def serve_index():
    return FileResponse(STATIC_DIR / "index.html")

@app.post("/task")
def receive_task(task: TaskRequest):
    now = datetime.now().strftime("%H:%M:%S")
    did = task.get_device_id()
    tn = task.get_task_name()

    # ===== TELEMETRY =====
    if did == "esp1":
        esp1_latest.update({
            "task_name": tn,
            "temperature": task.temperature,
            "received_at": now
        })
    elif did == "esp2":
        esp2_latest.update({
            "task_name": tn,
            "value": task.value,
            "received_at": now
        })

    # NORMAL İZLE KUYRUĞA GİRMEZ
    if tn == "normal_izle":
        return {"status": "ok", "queued": False}

    # ===== KUYRUK =====
    with queue_lock:

        # optional: queue limit
        if len(task_queue) > 30:
            task_queue.popleft()

        entry = {
            "id": f"{did}_{int(time.time() * 1000)}",
            "device_id": did,
            "task_name": tn,
            "temperature": task.temperature,
            "value": task.value,
            "status": "waiting",
            "arrived_at": now,
            "started_at": "",
            "finished_at": ""
        }

        task_queue.append(entry)

        print(f"[QUEUE] + {tn} ({did}) | size={len(task_queue)}")

        return {
            "status": "ok",
            "queued": True,
            "position": len(task_queue)
        }

@app.post("/done/{device_id}")
def task_done(device_id: str):
    global current_task

    did = device_id.lower()

    with queue_lock:
        if current_task is None:
            return {"status": "ok"}

        if current_task["device_id"] != did:
            return {"status": "error", "msg": "wrong device"}

        current_task["status"] = "done"
        current_task["finished_at"] = datetime.now().strftime("%H:%M:%S")

        completed_tasks.append(current_task.copy())

        if len(completed_tasks) > 20:
            completed_tasks.pop(0)

        print(f"[FIFO] BITTI -> {current_task['task_name']} ({did})")

        current_task = None

    return {"status": "ok"}

@app.get("/status")
def get_status():
    cpu = psutil.cpu_percent(interval=0.2)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    with queue_lock:
        return {
            "current_task": current_task,
            "queue": list(task_queue),
            "completed": completed_tasks[-10:],
            "esp1": esp1_latest,
            "esp2": esp2_latest,

            "raspberry": {
                "cpu": cpu,
                "ram_percent": ram.percent,
                "ram_used": round(ram.used / (1024 ** 3), 2),
                "ram_total": round(ram.total / (1024 ** 3), 2),
                "disk_percent": disk.percent,
                "disk_used": round(disk.used / (1024 ** 3), 2),
                "disk_total": round(disk.total / (1024 ** 3), 2)
            }
        }
@app.get("/next-command/{device_id}")
def get_next_command(device_id: str):
    did = device_id.lower()

    with queue_lock:
        if current_task and current_task["device_id"] == did:
            return {
                "execute": True,
                "command": {
                    "task_name": current_task["task_name"]
                }
            }

    return {"execute": False}

@app.post("/reset")
def reset_system():
    global current_task

    with queue_lock:
        task_queue.clear()
        current_task = None
        completed_tasks.clear()

    return {"status": "ok"}

# ===== STATIC =====
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
