#include <Arduino.h>
#include "rx5808.h"
#include "kalman.h"
#include <WiFi.h>
#include <PubSubClient.h>

// 🧩 Broches RX5808
#define RSSI_PIN    34
#define DATA_PIN    25
#define SS_PIN      26
#define CLOCK_PIN   27

// 📡 Fréquences à surveiller
const uint16_t frequencies[2] = {5658, 5732};

// 📊 Seuil RSSI (utile si local)
const uint16_t RSSI_THRESHOLD = 250;

// 🧠 Objets
RX5808 rx(RSSI_PIN, DATA_PIN, SS_PIN, CLOCK_PIN);
KalmanFilter kalman[2];

// 🔌 WiFi & MQTT
const char* ssid = "APFlyToBeALight";
const char* password = "FLYTOBEALIGHT";
const char* mqtt_server = "192.168.4.1";

WiFiClient espClient;
PubSubClient client(espClient);

// ⏱ Affichage périodique
unsigned long lastDisplayTime = 0;
const unsigned long displayInterval = 500;

float filteredRssiValues[2];
uint16_t rawRssiValues[2];

// 📶 Connexion WiFi
void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connecté");
}

// 🔁 Reconnexion MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");
    if (client.connect("ESP32_RX5808")) {
      Serial.println("Connecté !");
      client.subscribe("esp32/config/rssi"); // 🔁 Ecouter les configs
    } else {
      Serial.print("Échec, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

// 🔔 Callback MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Config RSSI reçue : ");
  Serial.println(message);
  // Ex: "300:700"
}

void setup() {
  Serial.begin(115200);
  rx.init();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  delay(2000); // Laisser le VTx s’allumer
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  for (int i = 0; i < 2; i++) {
    rx.setFrequency(frequencies[i]);
    delay(5);
    rawRssiValues[i] = rx.readRssi();
    filteredRssiValues[i] = kalman[i].filter(rawRssiValues[i], 0);
  }

  if (millis() - lastDisplayTime >= displayInterval) {
    lastDisplayTime = millis();

    for (int i = 0; i < 2; i++) {
      Serial.print("Freq ");
      Serial.print(frequencies[i]);
      Serial.print(" MHz - RSSI: ");
      Serial.print(rawRssiValues[i]);
      Serial.print(" | Filtré: ");
      Serial.println(filteredRssiValues[i]);

      // 📨 Publier RSSI sous forme : ESP32-1:432
      char payload[32];
      snprintf(payload, sizeof(payload), "ESP32-1:%.0f", filteredRssiValues[i]);
      client.publish("esp32/rssi", payload);
    }

    Serial.println();
  }

  delay(5);
}
