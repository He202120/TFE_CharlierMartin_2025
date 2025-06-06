#ifndef KALMAN_H
#define KALMAN_H

#include <Arduino.h>

class KalmanFilter {
  public:
    KalmanFilter();

    float filter(uint16_t z, uint16_t u = 0);
    float lastMeasurement();
    void setMeasurementNoise(float noise);
    void setProcessNoise(float noise);

  private:
    float x;
    float p;  
    float q; 
    float r;  
};

#endif
