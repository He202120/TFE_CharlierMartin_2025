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
const uint16_t frequencies[2] = {5658, 5732}; // ajusté à 2 valeurs

// 📊 Seuil RSSI
const uint16_t RSSI_THRESHOLD = 250;

// 🧠 Objets
RX5808 rx(RSSI_PIN, DATA_PIN, SS_PIN, CLOCK_PIN);
KalmanFilter kalman[2];

// MQTT & WiFi
const char* ssid = "APFlyToBeALight";  
const char* password = "FLYTOBEALIGHT";  
const char* mqtt_server = "192.168.4.1";

WiFiClient espClient;
PubSubClient client(espClient);

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

// 🔄 Connexion MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");
    if (client.connect("ESP32_RX5808")) {
      Serial.println("Connecté !");
    } else {
      Serial.print("Échec, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  rx.init();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
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

      // 📨 Publier sur MQTT
      char topic[64];
      snprintf(topic, sizeof(topic), "drones/drone1/freq_%d/rssi", frequencies[i]);

      char payload[16];
      dtostrf(filteredRssiValues[i], 4, 1, payload); // Ex: "248.6"

      client.publish(topic, payload);
    }

    Serial.println();
  }

  delay(5);
}
