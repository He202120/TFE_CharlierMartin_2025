#include <Arduino.h>
#ifndef CONFIG_H
#define CONFIG_H

// Pins
#define RSSI_PIN 34
#define DATA_PIN 25
#define SS_PIN 26
#define CLOCK_PIN 27
#define LED_PIN 2

// Leds
#define LED_STRIP_PIN 4
#define NUM_LEDS 8

// Réseau
#define WIFI_SSID "APFlyToBeALight"
#define WIFI_PASS "FLYTOBEALIGHT"

// MQTT
#define MQTT_SERVER "192.168.4.1"
#define MQTT_PORT 1883
#define MQTT_USER "esp32_client"
#define MQTT_PASS "esp32CLIENT"
#define MQTT_TOPIC_SUB "esp32/config/rssi"
#define MQTT_TOPIC_PUB "esp32/rssi"

// Identifiant unique de l'ESP32
#define DEVICE_ID "ESP32-1"

// Autres constantes
#define NUM_FREQS 1
const unsigned long displayInterval = 500;

#endif
