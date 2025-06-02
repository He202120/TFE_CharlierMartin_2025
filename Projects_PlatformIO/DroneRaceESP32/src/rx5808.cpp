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
    digitalWrite(spiClockPin, LOW);
    digitalWrite(spiDataPin, LOW);
    digitalWrite(slaveSelectPin, HIGH);
}

void RX5808::sendBits(uint32_t data, uint8_t bits) {
    for (int i = 0; i < bits; i++) {
        digitalWrite(spiClockPin, LOW);
        digitalWrite(spiDataPin, (data >> i) & 0x01);
        delayMicroseconds(1);
        digitalWrite(spiClockPin, HIGH);
        delayMicroseconds(1);
    }
}

void RX5808::setFrequency(uint16_t freqMHz) {
    uint32_t freq = freqMHz * 1000UL;
    uint32_t f_osc = 8000000UL; 
    uint32_t r_div = 8;

    uint32_t divider = freq / (f_osc / r_div * 2);
    uint16_t N = divider / 32;
    uint8_t A = divider % 32;

    uint32_t data = 0;
    data |= (0x1 << 21); 
    data |= (0 << 20);   
    data |= ((uint32_t)N << 8);
    data |= A;

    digitalWrite(slaveSelectPin, LOW);
    delayMicroseconds(1);
    sendBits(data, 25); 
    digitalWrite(slaveSelectPin, HIGH);
    delay(2);
}

uint16_t RX5808::readRssi() {
    return analogRead(rssiPin);
}
