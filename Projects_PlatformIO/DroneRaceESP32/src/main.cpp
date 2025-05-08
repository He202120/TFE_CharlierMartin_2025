#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"
#include "rx5808.h"
#include "kalman.h"
#include "effects.h"

WiFiClient espClient;
PubSubClient client(espClient);
RX5808 rx(RSSI_PIN, DATA_PIN, SS_PIN, CLOCK_PIN);
KalmanFilter kalman[NUM_FREQS];

unsigned long lastDisplayTime = 0;
float filteredRssiValues[NUM_FREQS];
uint16_t rawRssiValues[NUM_FREQS];
String deviceId = DEVICE_ID;

void setup_wifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void handleEffect(const String& effect) {
  if (effect == "Rainbow") startRainbow();
  else if (effect == "Blink") startBlink();
  else if (effect == "Static") startStatic();
  else if (effect == "Fade") startFade();
  else if (effect == "Wipe") startWipe();
  else if (effect == "Color Cycle") startColorCycle();
  else if (effect == "Strobe") startStrobe();
  else Serial.println("Effet inconnu : " + effect);
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
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
      client.subscribe("esp32/effect");
      client.subscribe(("esp32/" + deviceId + "/effect").c_str());
      client.subscribe(MQTT_TOPIC_SUB);
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
}

void loop() {
  if (!client.connected()) {
    digitalWrite(LED_PIN, LOW);
    reconnect();
  }

  client.loop();

  for (int i = 0; i < NUM_FREQS; i++) {
    rx.setFrequency(frequencies[i]);
    delay(5);
    rawRssiValues[i] = rx.readRssi();
    filteredRssiValues[i] = kalman[i].filter(rawRssiValues[i], 0);
  }

  if (millis() - lastDisplayTime >= displayInterval) {
    lastDisplayTime = millis();
    for (int i = 0; i < NUM_FREQS; i++) {
      char payload[64];
      snprintf(payload, sizeof(payload), "%s:%.0f", deviceId.c_str(), filteredRssiValues[i]);
      client.publish(MQTT_TOPIC_PUB, payload);
    }
  }

  delay(5);
}
