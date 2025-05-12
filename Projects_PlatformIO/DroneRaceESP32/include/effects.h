#ifndef EFFECTS_H
#define EFFECTS_H

#include <Arduino.h>

void startRainbow();
void startBlink();
void startStatic();
void startFade();
void startWipe();
void startColorCycle();
void startStrobe();
void startStaticColor(uint8_t r, uint8_t g, uint8_t b);
void applyRaceEffect(const String& effect, const String& color);
void stopEffect();

#endif
