#ifndef EFFECTS_H
#define EFFECTS_H

#include <Arduino.h>

void setupStrip();
void stopEffect();

void flashRainbowSegmented(int speed, int intensity);
void flashBlink(int speed, int intensity, const String& color);
void flashStrobe(int speed, int intensity);
void flashWipe(int speed, int intensity, const String& color);
void flashCycle(int speed, int intensity);

void effectHexaPulse(int speed, int intensity, const String& color);
void effectHexaWings(int speed, int intensity, const String& color);

void applyRaceEffect(const String& effect, const String& color, int speed = 50, int intensity = 100);

#endif
