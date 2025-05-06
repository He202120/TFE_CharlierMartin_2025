#include "rx5808.h"
#include <Arduino.h>

RX5808::RX5808(uint8_t _rssiPin, uint8_t _spiDataPin, uint8_t _slaveSelectPin, uint8_t _spiClockPin) {
    rssiPin = _rssiPin;
    spiDataPin = _spiDataPin;
    slaveSelectPin = _slaveSelectPin;
    spiClockPin = _spiClockPin;
}

void RX5808::init() {
    pinMode(rssiPin, INPUT);
    pinMode(spiDataPin, OUTPUT);
    pinMode(slaveSelectPin, OUTPUT);
    pinMode(spiClockPin, OUTPUT);
}

void RX5808::setFrequency(uint16_t frequency) {
    // Implémentation vide ou appel à getFrequencyIndex() + setFrequencyByIndex() si tu l'utilises
}

uint16_t RX5808::readRssi() {
    return analogRead(rssiPin);
}
