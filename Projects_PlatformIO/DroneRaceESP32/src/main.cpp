#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "rx5808.h"
#include "kalman.h"
#include "effects.h"

#define DETECTION_THRESHOLD 600

WiFiClientSecure espClient;
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

unsigned long lastHelloTime = 0;
bool detectionActive = false;

void setup_wifi() {
  Serial.print("Connexion WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connecté !");
}

void handleEffect(const String& message) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("Effet simple reçu : ");
    Serial.println(message);
    if (message == "Off") {
      stopEffect();
    } else {
      applyRaceEffect(message, "");
    }
    return;
  }

  String effect = doc["effect"] | "";
  String color = doc["color"] | "";
  int speed = doc["speed"] | 50;
  int intensity = doc["intensity"] | 100;

  if (effect == "Off") {
    stopEffect();
    return;
  }

  Serial.println("Effet JSON reçu :");
  Serial.println(" - effet     : " + effect);
  Serial.println(" - couleur   : " + color);
  Serial.println(" - vitesse   : " + String(speed));
  Serial.println(" - intensité : " + String(intensity));

  applyRaceEffect(effect, color, speed, intensity);
}

void handleRaceCommand(const String& cmd) {
  if (cmd == "start") {
    detectionActive = true;
    Serial.println(">>> Détection ACTIVÉE");
  } else if (cmd == "stop") {
    detectionActive = false;
    stopEffect();
    Serial.println(">>> Détection désactivée");
  }
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

  if (topicStr == "esp32/race") {
    handleRaceCommand(message);
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
      client.subscribe("esp32/effect");
      client.subscribe(("esp32/" + deviceId + "/effect").c_str());
      client.subscribe(MQTT_TOPIC_SUB);
      client.subscribe(("esp32/" + deviceId + "/config").c_str());
      client.subscribe("esp32/race");
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

  espClient.setInsecure();

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
  delay(2000);

  Serial.println("Setup terminé");
}

void loop() {
  if (!client.connected()) {
    digitalWrite(LED_PIN, LOW);
    reconnect();
  }

  client.loop();

  if (!detectionActive) {
    if (millis() - lastHelloTime >= 1000) {
      lastHelloTime = millis();
      client.publish("esp32/hello", deviceId.c_str());
    }
    delay(5);
    return;
  }

  if (numFrequencies == 0) {
    rx.setFrequency(5800);
    delay(30);
    rx.readRssi();
    delay(5);
    int rssi = rx.readRssi();
    char payload[64];
    snprintf(payload, sizeof(payload), "%s:%d", deviceId.c_str(), rssi);
    client.publish(MQTT_TOPIC_PUB, payload);
  } else if (!calibrated) {
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
        baselineRSSI[i] = rssiSums[i] / sampleCounts;
      }
      calibrated = true;
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

    if (filteredRssiValues[scanIndex] > threshold) {
      if (!effectRunning[scanIndex]) {
        applyRaceEffect(effects[scanIndex], colors[scanIndex]);
        lastEffectTime[scanIndex] = millis();
        effectRunning[scanIndex] = true;
      }
    }

    if (effectRunning[scanIndex] && millis() - lastEffectTime[scanIndex] >= 2000) {
      stopEffect();
      effectRunning[scanIndex] = false;
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

  if (millis() - lastHelloTime >= 1000) {
    lastHelloTime = millis();
    client.publish("esp32/hello", deviceId.c_str());
  }

  delay(5);
}
