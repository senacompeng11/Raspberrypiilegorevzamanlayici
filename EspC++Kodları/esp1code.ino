#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// ===== WiFi =====
const char* ssid       = "SENA 4413";
const char* password   = "79f77P6/";
const char* serverTask = "http://192.168.137.95:8001/task";
const char* serverDone = "http://192.168.137.95:8001/done/esp2";
const char* serverCmd  = "http://192.168.137.95:8001/next-command/esp2";

// ===== Pin =====
#define LDR_PIN D7   // LOW = ışık var, HIGH = karanlık

WiFiClient wifiClient;

// ===== Kontrol =====
bool alreadySent = false;

// ===== HTTP POST =====
int httpPost(const char* url, String body) {
  HTTPClient http;
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
  return code;
}

// ===== HTTP GET =====
String httpGet(const char* url) {
  HTTPClient http;
  http.begin(wifiClient, url);
  int code = http.GET();
  String payload = "";
  if (code == 200) payload = http.getString();
  http.end();
  return payload;
}

// ===== Görevi çalıştır =====
void runTask(String task) {
  Serial.println("[RUN] " + task);
  // ESP2 fiziksel aksiyon almıyor (sadece dashboard animasyonu)
  delay(500);
}

// ===== Done bildir =====
void notifyDone() {
  int code = httpPost(serverDone, "{}");
  Serial.println("[DONE] HTTP " + String(code));
}

void setup() {
  Serial.begin(115200);
  pinMode(LDR_PIN, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("WiFi baglaniyor");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nBaglandi: " + WiFi.localIP().toString());
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    return;
  }

  // ===== LDR OKU =====
  int pinValue = digitalRead(LDR_PIN);
  bool isLight = (pinValue == LOW);

  Serial.print("[LDR] ");
  Serial.println(isLight ? "ISIK VAR" : "KARANLIK");

  // ===== SADECE IŞIK GELİNCE TASK GÖNDER =====
  if (isLight && !alreadySent) {

    alreadySent = true;

    String task = "laptop_ac";

    String json = "{\"device_id\":\"esp2\","
                  "\"task_name\":\"" + task + "\","
                  "\"value\":1}";

    int code = httpPost(serverTask, json);
    Serial.println("[TASK] Gonderildi -> " + task + " (HTTP " + String(code) + ")");

    
    unsigned long start = millis();
    bool executed = false;

    while (millis() - start < 60000UL) {
      String resp = httpGet(serverCmd);

      if (resp.indexOf("\"execute\":true") >= 0) {
        runTask(task);
        notifyDone();
        executed = true;
        break;
      }

      delay(1000);
    }

    if (!executed) {
      Serial.println("[WARN] Timeout — gorev calismadi");
    }
  }

  // ===== IŞIK YOKSA RESETLE (TEKRAR GÖNDERİLEBİLSİN) =====
  if (!isLight) {
    alreadySent = false;
  }

  delay(500);
}
