
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
    // Convertit la fréquence MHz vers valeur N pour RX5808
    uint16_t N = (frequency - 479) / 2;
    uint16_t command = 0b1000000000000000 | (N & 0x7FF); // MSB=1 + 11 bits pour N

    // Transmission SPI "bit-bang"
    digitalWrite(slaveSelectPin, LOW);
    delayMicroseconds(1);

    for (int i = 15; i >= 0; i--) {
        digitalWrite(spiClockPin, LOW);
        digitalWrite(spiDataPin, (command >> i) & 1);
        delayMicroseconds(1);
        digitalWrite(spiClockPin, HIGH);
        delayMicroseconds(1);
    }

    digitalWrite(slaveSelectPin, HIGH);
    delay(2);  // Temps de stabilisation du RX5808
}

uint16_t RX5808::readRssi() {
    return analogRead(rssiPin);
}
