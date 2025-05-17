#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "rx5808.h"
#include "kalman.h"
#include "effects.h"

#define DETECTION_THRESHOLD 600

WiFiClient espClient;
PubSubClient client(espClient);
RX5808 rx(RSSI_PIN, DATA_PIN, SS_PIN, CLOCK_PIN);
KalmanFilter kalman[NUM_FREQS];

uint16_t frequencies[NUM_FREQS];
String effects[NUM_FREQS];
String colors[NUM_FREQS];
float baselineRSSI[NUM_FREQS];

unsigned long lastDisplayTime = 0;
float filteredRssiValues[NUM_FREQS];
uint16_t rawRssiValues[NUM_FREQS];
String deviceId = DEVICE_ID;

int numFrequencies = 0;
int scanIndex = 0;

bool calibrated = false;
unsigned long calibrationStart = 0;
const int calibrationDuration = 5000;

unsigned long lastEffectTime[NUM_FREQS] = {0};
bool effectRunning[NUM_FREQS] = {false};

void setup_wifi() {
  Serial.print("Connexion WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connecté !");
}

void handleEffect(const String& effect) {
  applyRaceEffect(effect, "");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  String topicStr = String(topic);
  Serial.print("MQTT → ");
  Serial.println(topicStr);

  if (topicStr == "esp32/effect" || topicStr == "esp32/" + deviceId + "/effect") {
    handleEffect(message);
  }

  if (topicStr == "esp32/" + deviceId + "/config") {
    Serial.println("Message reçu sur topic config:");
    Serial.println(message);

    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      JsonArray freqArray = doc["frequencies"];
      JsonArray effectArray = doc["effects"];
      JsonArray colorArray = doc["colors"];
      int count = min((int)freqArray.size(), NUM_FREQS);

      for (int i = 0; i < count; i++) {
        frequencies[i] = freqArray[i];
        effects[i] = effectArray[i].as<String>();
        colors[i] = colorArray[i].isNull() ? "" : colorArray[i].as<String>();
      }

      numFrequencies = count;
      Serial.print("Fréquences configurées : ");
      Serial.println(numFrequencies);

      calibrationStart = millis();
      calibrated = false;
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
      client.subscribe("esp32/effect");
      client.subscribe(("esp32/" + deviceId + "/effect").c_str());
      client.subscribe(MQTT_TOPIC_SUB);
      client.subscribe(("esp32/" + deviceId + "/config").c_str());
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(LED_PIN, LOW);
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== BOOT ===");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  rx.init();
  Serial.println("RX5808 prêt");

  setup_wifi();
  Serial.println("WiFi prêt");

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
  delay(2000);

  frequencies[0] = 5658;
  effects[0] = "Static";
  colors[0] = "#ffffff";
  numFrequencies = 1;

  calibrationStart = millis();
  calibrated = false;

  Serial.println("Setup terminé");
}

void loop() {
  if (!client.connected()) {
    digitalWrite(LED_PIN, LOW);
    reconnect();
  }

  client.loop();

  if (numFrequencies == 0) {
    delay(5);
    return;
  }

  if (!calibrated) {
    static float rssiSums[NUM_FREQS] = {0};
    static int sampleCounts = 0;

    rx.setFrequency(frequencies[scanIndex]);
    delay(30);
    rx.readRssi();
    delay(5);
    rawRssiValues[scanIndex] = rx.readRssi();
    rssiSums[scanIndex] += rawRssiValues[scanIndex];

    if (++scanIndex >= numFrequencies) {
      scanIndex = 0;
      sampleCounts++;
    }

    if (millis() - calibrationStart >= calibrationDuration) {
      for (int i = 0; i < numFrequencies; i++) {
        Serial.print("Config reçue : Freq ");
        Serial.print(frequencies[i]);
        Serial.print(" - Effet: ");
        Serial.println(effects[i]);
        baselineRSSI[i] = rssiSums[i] / sampleCounts;
      }
      calibrated = true;
      Serial.println("Calibration terminée :");
      for (int i = 0; i < numFrequencies; i++) {
        Serial.print("Freq ");
        Serial.print(frequencies[i]);
        Serial.print(" → baseline : ");
        Serial.println(baselineRSSI[i]);
      }
    }

  } else {
    rx.setFrequency(frequencies[scanIndex]);
    delay(30);
    rx.readRssi();
    delay(5);
    rawRssiValues[scanIndex] = rx.readRssi();
    filteredRssiValues[scanIndex] = kalman[scanIndex].filter(rawRssiValues[scanIndex], 0);

    float threshold = (baselineRSSI[scanIndex] + 80.0f > 450.0f)
                  ? baselineRSSI[scanIndex] + 80.0f
                  : 450.0f;

    Serial.print("Scan index → ");
    Serial.print(scanIndex);
    Serial.print(" | Freq ");
    Serial.print(frequencies[scanIndex]);
    Serial.print(" → RSSI: ");
    Serial.print(filteredRssiValues[scanIndex]);
    Serial.print(" / Seuil: ");
    Serial.println(threshold);

    if (filteredRssiValues[scanIndex] > threshold) {
      if (!effectRunning[scanIndex]) {
        applyRaceEffect(effects[scanIndex], colors[scanIndex]);
        lastEffectTime[scanIndex] = millis();
        effectRunning[scanIndex] = true;
        Serial.print("Effet déclenché sur ");
        Serial.println(frequencies[scanIndex]);
      }
    }

    if (effectRunning[scanIndex] && millis() - lastEffectTime[scanIndex] >= 2000) {
      stopEffect();
      effectRunning[scanIndex] = false;
      Serial.print("Effet arrêté sur ");
      Serial.println(frequencies[scanIndex]);
    }

    scanIndex = (scanIndex + 1) % numFrequencies;

    if (millis() - lastDisplayTime >= displayInterval) {
      lastDisplayTime = millis();
      for (int i = 0; i < numFrequencies; i++) {
        char payload[64];
        snprintf(payload, sizeof(payload), "%s:%.0f", deviceId.c_str(), filteredRssiValues[i]);
        client.publish(MQTT_TOPIC_PUB, payload);
      }
    }
  }

  delay(5);
}
