#include "kalman.h"

KalmanFilter::KalmanFilter() {
  x = 0;
  p = 1;
  q = 0.01;
  r = 5;
}

float KalmanFilter::filter(uint16_t z, uint16_t u) {
  // Implementation du filtre
  float prediction = x;
  float innovation = z - prediction;
  p = p + q;
  float k = p / (p + r);
  x = prediction + k * innovation;
  p = (1 - k) * p;
  return x;
}
