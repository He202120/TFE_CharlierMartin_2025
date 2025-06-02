#include "effects.h"
#include <Adafruit_NeoPixel.h>
#include "config.h"

Adafruit_NeoPixel strip(NUM_LEDS, LED_STRIP_PIN, NEO_GRB + NEO_KHZ800);

void setupStrip() {
  strip.begin();
  strip.show();
}

void flashRainbowSegmented(int speed, int intensity) {
  setupStrip();
  int segmentSize = 6;
  int segments = NUM_LEDS / segmentSize;

  for (int shift = 0; shift < 256; shift += 10) {
    for (int seg = 0; seg < segments; seg++) {
      for (int i = 0; i < segmentSize; i++) {
        int led = seg * segmentSize + i;
        uint16_t hue = ((i * 65536L / segmentSize) + (shift * 256)) % 65536;
        uint32_t color = strip.ColorHSV(hue, 255, intensity * 255 / 100);
        strip.setPixelColor(led, color);
      }
    }
    strip.show();
    delay(map(100 - speed, 0, 100, 20, 100));
  }

  strip.clear();
  strip.show();
}

void flashBlink(int speed, int intensity, const String& color) {
  setupStrip();
  uint32_t c = strip.Color(255, 0, 0);
  if (color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    c = strip.Color(r * intensity / 100, g * intensity / 100, b * intensity / 100);
  }

  for (int i = 0; i < 5; i++) {
    for (int p = 0; p < strip.numPixels(); p++) strip.setPixelColor(p, c);
    strip.show();
    delay(map(100 - speed, 0, 100, 30, 150));
    strip.clear();
    strip.show();
    delay(map(100 - speed, 0, 100, 30, 150));
  }

  strip.clear();
  strip.show();
}

void flashStrobe(int speed, int intensity) {
  setupStrip();
  uint32_t white = strip.Color(255 * intensity / 100, 255 * intensity / 100, 255 * intensity / 100);
  for (int i = 0; i < 6; i++) {
    for (int j = 0; j < strip.numPixels(); j++)
      strip.setPixelColor(j, white);
    strip.show();
    delay(map(100 - speed, 0, 100, 20, 100));
    strip.clear();
    strip.show();
    delay(map(100 - speed, 0, 100, 20, 100));
  }

  strip.clear();
  strip.show();
}

void flashWipe(int speed, int intensity, const String& color) {
  setupStrip();
  uint32_t c = strip.Color(0, 0, 255 * intensity / 100);
  if (color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    c = strip.Color(r * intensity / 100, g * intensity / 100, b * intensity / 100);
  }
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, c);
    strip.show();
    delay(map(100 - speed, 0, 100, 5, 30));
  }

  strip.clear();
  strip.show();
}

void flashCycle(int speed, int intensity) {
  setupStrip();
  uint32_t colors[] = {
    strip.Color(255 * intensity / 100, 0, 0),
    strip.Color(0, 255 * intensity / 100, 0),
    strip.Color(0, 0, 255 * intensity / 100)
  };
  for (int c = 0; c < 3; c++) {
    for (int i = 0; i < strip.numPixels(); i++)
      strip.setPixelColor(i, colors[c]);
    strip.show();
    delay(map(100 - speed, 0, 100, 100, 300));
  }

  strip.clear();
  strip.show();
}

void effectHexaPulse(int speed, int intensity, const String& color) {
  setupStrip();
  int segmentSize = 6;
  uint32_t c = strip.Color(255, 255, 255);

  if (color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    c = strip.Color(r * intensity / 100, g * intensity / 100, b * intensity / 100);
  }

  for (int seg = 0; seg < 5; seg++) {
    strip.clear();
    for (int i = 0; i < segmentSize; i++) {
      int idx = seg * segmentSize + i;
      strip.setPixelColor(idx, c);
    }
    strip.show();
    delay(map(100 - speed, 0, 100, 50, 200));
  }

  strip.clear();
  strip.show();
}

void effectHexaWings(int speed, int intensity, const String& color) {
  setupStrip();
  int segmentSize = 6;
  uint32_t c = strip.Color(255, 255, 255);

  if (color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    c = strip.Color(r * intensity / 100, g * intensity / 100, b * intensity / 100);
  }

  for (int i = 0; i < 3; i++) {
    strip.clear();
    int left = i;
    int right = 4 - i;
    for (int j = 0; j < segmentSize; j++) {
      strip.setPixelColor(left * segmentSize + j, c);
      if (left != right)
        strip.setPixelColor(right * segmentSize + j, c);
    }
    strip.show();
    delay(map(100 - speed, 0, 100, 60, 180));
  }

  strip.clear();
  strip.show();
}

void stopEffect() {
  setupStrip();
  strip.clear();
  strip.show();
}

void applyRaceEffect(const String& effect, const String& color, int speed, int intensity) {
  if (effect == "Static" && color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    setupStrip();
    for (int i = 0; i < strip.numPixels(); i++)
      strip.setPixelColor(i, strip.Color(r * intensity / 100, g * intensity / 100, b * intensity / 100));
    strip.show();
    return;
  }

  if (effect == "Rainbow") flashRainbowSegmented(speed, intensity);
  else if (effect == "Blink") flashBlink(speed, intensity, color);
  else if (effect == "Strobe") flashStrobe(speed, intensity);
  else if (effect == "Wipe") flashWipe(speed, intensity, color);
  else if (effect == "Color Cycle") flashCycle(speed, intensity);
  else if (effect == "HexaPulse") effectHexaPulse(speed, intensity, color);
  else if (effect == "HexaWings") effectHexaWings(speed, intensity, color);
}
