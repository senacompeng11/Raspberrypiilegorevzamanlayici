#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>
#include <Servo.h>

// ===== WiFi =====
const char* ssid       = "SENA 4413";
const char* password   = "79f77P6/";
const char* serverTask = "http://192.168.137.95:8001/task";
const char* serverDone = "http://192.168.137.95:8001/done/esp1";
const char* serverCmd  = "http://192.168.137.95:8001/next-command/esp1";

// ===== Pin Tanımları =====
#define DHTPIN     D4
#define DHTTYPE    DHT11
#define BUZZER_PIN D6
#define SERVO_PIN  D5

DHT   dht(DHTPIN, DHTTYPE);
Servo servo;

// ===== Durum =====
String currentTask = "";
bool   taskRunning = false;

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("WiFi bağlanıyor");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nBağlandı: " + WiFi.localIP().toString());

  dht.begin();
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  servo.attach(SERVO_PIN);
  servo.write(0);
}

// ===== HTTP POST yardımcısı =====
int httpPost(const char* url, String body) {
  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
  return code;
}

// ===== HTTP GET yardımcısı =====
String httpGet(const char* url) {
  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  int code = http.GET();
  String payload = "";
  if (code == 200) payload = http.getString();
  http.end();
  return payload;
}

// ===== Görevi çalıştır =====
void runTask(String task) {
  Serial.println("[RUN] " + task);

  if (task == "buzzer_on") {
    for (int i = 0; i < 6; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(800);
      digitalWrite(BUZZER_PIN, LOW);
      delay(700);
    }

  } else if (task == "fan_ac") {
    unsigned long fanStart = millis();
    while (millis() - fanStart < 3000) {
      for (int pos = 0; pos <= 180; pos += 5) {
        servo.write(pos);
        delay(15);
      }
      for (int pos = 180; pos >= 0; pos -= 5) {
        servo.write(pos);
        delay(15);
      }
    }
    servo.write(90);

  } else {
    delay(1000);
  }
}

// ===== Görevi sunucuya bildir (done) =====
void notifyDone() {
  String body = "{}";
  int code = httpPost(serverDone, body);
  Serial.println("[DONE] HTTP " + String(code));
}

void loop() {
  // 1. Sıcaklık oku
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("Sensör okunamadı!");
    delay(2000);
    return;
  }
  Serial.print("Sıcaklık: ");
  Serial.println(temp);

  // 2. Görevi belirle
  String task = "normal_izle";
  if      (temp > 28) task = "fan_ac";
  else if (temp > 25) task = "buzzer_on";

  // 3. Sunucuya gönder
  String json = "{\"device_id\":\"esp1\","
                "\"task_name\":\"" + task + "\","
                "\"temperature\":" + String(temp, 1) + "}";
  int code = httpPost(serverTask, json);
  Serial.println("[TASK] Gönderildi → " + task + " (HTTP " + String(code) + ")");

  // 4. Sıramızı bekle (polling)
  unsigned long start = millis();
  while (millis() - start < 10000) {
    String resp = httpGet(serverCmd);
    if (resp.indexOf("\"execute\":true") >= 0) {
      runTask(task);
      notifyDone();
      break;
    }
    delay(500);
  }

  delay(5000);
}
