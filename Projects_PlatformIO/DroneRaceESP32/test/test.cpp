#include <Arduino.h>
#include "kalman.h"
#include "rx5808.h"
#include "effects.h"
#include "config.h"

KalmanFilter kalman;

RX5808 rx(RSSI_PIN, DATA_PIN, SS_PIN, CLOCK_PIN);

void test_kalman() {
  Serial.println("=== TEST KALMAN ===");

  float v1 = kalman.filter(100);
  Serial.print("Première estimation : ");
  Serial.println(v1);

  for (int i = 0; i < 10; i++) kalman.filter(200);
  float v2 = kalman.filter(200);
  Serial.print("Estimation convergente : ");
  Serial.println(v2);

  Serial.println("=== FIN TEST KALMAN ===");
}

void test_rx5808() {
  Serial.println("=== TEST RX5808 ===");

  rx.init();
  rx.setFrequency(5800);
  delay(30);
  int rssi = rx.readRssi();

  Serial.print("RSSI mesuré (approximatif) : ");
  Serial.println(rssi);

  Serial.println("=== FIN TEST RX5808 ===");
}

void test_effects() {
  Serial.println("=== TEST EFFECTS ===");

  applyRaceEffect("Blink", "#FF0000", 70, 80);
  delay(1000);  

  stopEffect();

  Serial.println("Effet Blink terminé");

  Serial.println("=== FIN TEST EFFECTS ===");
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n=== LANCEMENT TEST COMPLET ===");

  test_kalman();
  delay(500);

  test_rx5808();
  delay(500);

  test_effects();
  delay(500);

  Serial.println("=== TOUS LES TESTS TERMINÉS ===");
}

void loop() {}
