#ifndef RX5808_H
#define RX5808_H

#include <Arduino.h>

class RX5808 {
public:
    RX5808(uint8_t _rssiPin, uint8_t _spiDataPin, uint8_t _slaveSelectPin, uint8_t _spiClockPin);
    void init();
    void setFrequency(uint16_t frequency);
    uint16_t readRssi();

private:
    uint8_t rssiPin;
    uint8_t spiDataPin;
    uint8_t slaveSelectPin;
    uint8_t spiClockPin;
};

#endif
