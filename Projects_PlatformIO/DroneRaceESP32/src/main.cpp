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

bool calibrated = false;
unsigned long calibrationStart = 0;
const int calibrationDuration = 2000;

unsigned long effectStartTime = 0;
bool effectActive = false;
String currentEffect = "";
String currentColor = "";

void setup_wifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void handleEffect(const String& effect) {
  applyRaceEffect(effect, "");
  effectStartTime = millis();
  effectActive = true;
  currentEffect = effect;
  currentColor = "";
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  String topicStr = String(topic);

  if (topicStr == "esp32/effect" || topicStr == "esp32/" + deviceId + "/effect") {
    handleEffect(message);
  }

  if (topicStr == "esp32/" + deviceId + "/config") {
    Serial.println("Message reçu sur topic config:");
    Serial.println(message);

    StaticJsonDocument<512> doc;
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

      numFrequencies = count;  // ← correction essentielle
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
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  rx.init();
  setup_wifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
  delay(2000);

  frequencies[0] = 5658;
  effects[0] = "Static";
  colors[0] = "#ffffff";
  numFrequencies = 1;

  calibrationStart = millis();
  calibrated = false;
}

void loop() {
  if (!client.connected()) {
    digitalWrite(LED_PIN, LOW);
    reconnect();
  }

  client.loop();

  if (!calibrated) {
    static float rssiSums[NUM_FREQS] = {0};
    static int sampleCounts = 0;

    for (int i = 0; i < numFrequencies; i++) {
      rx.setFrequency(frequencies[i]);
      delay(5);
      rawRssiValues[i] = rx.readRssi();
      rssiSums[i] += rawRssiValues[i];
    }
    sampleCounts++;

    if (millis() - calibrationStart >= calibrationDuration) {
      for (int i = 0; i < numFrequencies; i++) {
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
    for (int i = 0; i < numFrequencies; i++) {
      rx.setFrequency(frequencies[i]);
      delay(5);
      rawRssiValues[i] = rx.readRssi();
      filteredRssiValues[i] = kalman[i].filter(rawRssiValues[i], 0);

      Serial.print("Freq ");
      Serial.print(frequencies[i]);
      Serial.print(" → RSSI: ");
      Serial.print(filteredRssiValues[i]);
      Serial.print(" / Seuil: ");
      Serial.println(baselineRSSI[i] + 80);

      if (filteredRssiValues[i] > baselineRSSI[i] + 80) {
        applyRaceEffect(effects[i], colors[i]);
        Serial.print("Effet déclenché sur ");
        Serial.println(frequencies[i]);
      }
    }

    if (millis() - lastDisplayTime >= displayInterval) {
      lastDisplayTime = millis();
      for (int i = 0; i < numFrequencies; i++) {
        char payload[64];
        snprintf(payload, sizeof(payload), "%s:%.0f", deviceId.c_str(), filteredRssiValues[i]);
        client.publish(MQTT_TOPIC_PUB, payload);
      }
    }
  }

  if (effectActive && millis() - effectStartTime >= 10000) {
    effectActive = false;
    currentEffect = "";
    currentColor = "";
    stopEffect();
    Serial.println("Effet coupé automatiquement");
  }

  if (numFrequencies == 0 && millis() - lastDisplayTime >= displayInterval) {
    lastDisplayTime = millis();
    String msg = deviceId + ":0";
    client.publish(MQTT_TOPIC_PUB, msg.c_str());
  }

  delay(5);
}
