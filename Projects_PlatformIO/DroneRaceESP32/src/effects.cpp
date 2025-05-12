#include "effects.h"
#include <Adafruit_NeoPixel.h>
#include "config.h"

Adafruit_NeoPixel strip(NUM_LEDS, LED_STRIP_PIN, NEO_GRB + NEO_KHZ800);

void setupStrip() {
  strip.begin();
  strip.show();
}

void startRainbow() {
  setupStrip();
  for (int i = 0; i < strip.numPixels(); i++) {
    uint32_t color = strip.ColorHSV((i * 65536L / strip.numPixels()), 255, 255);
    strip.setPixelColor(i, color);
  }
  strip.show();
}

void startBlink() {
  setupStrip();
  uint32_t red = strip.Color(255, 0, 0);
  uint32_t off = strip.Color(0, 0, 0);
  for (int i = 0; i < strip.numPixels(); i++) strip.setPixelColor(i, red);
  strip.show();
  delay(300);
  for (int i = 0; i < strip.numPixels(); i++) strip.setPixelColor(i, off);
  strip.show();
}

void startStatic() {
  setupStrip();
  uint32_t white = strip.Color(255, 255, 255);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, white);
  }
  strip.show();
}

void startFade() {
  setupStrip();
  for (int b = 0; b <= 255; b += 5) {
    for (int i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, strip.Color(b, b, b));
    }
    strip.show();
    delay(15);
  }
}

void startWipe() {
  setupStrip();
  uint32_t blue = strip.Color(0, 0, 255);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, blue);
    strip.show();
    delay(50);
  }
}

void startColorCycle() {
  setupStrip();
  uint32_t colors[] = {
    strip.Color(255, 0, 0),
    strip.Color(0, 255, 0),
    strip.Color(0, 0, 255),
    strip.Color(255, 255, 0),
    strip.Color(0, 255, 255)
  };
  static int index = 0;
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, colors[index]);
  }
  strip.show();
  index = (index + 1) % (sizeof(colors) / sizeof(colors[0]));
}

void startStrobe() {
  setupStrip();
  uint32_t white = strip.Color(255, 255, 255);
  uint32_t off = strip.Color(0, 0, 0);
  for (int s = 0; s < 5; s++) {
    for (int i = 0; i < strip.numPixels(); i++) strip.setPixelColor(i, white);
    strip.show();
    delay(100);
    for (int i = 0; i < strip.numPixels(); i++) strip.setPixelColor(i, off);
    strip.show();
    delay(100);
  }
}

void startStaticColor(uint8_t r, uint8_t g, uint8_t b) {
  setupStrip();
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void applyRaceEffect(const String& effect, const String& color) {
  if (effect == "Static" && color.length() == 7 && color[0] == '#') {
    long hex = strtol(color.substring(1).c_str(), NULL, 16);
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = hex & 0xFF;
    startStaticColor(r, g, b);
  } else {
    if (effect == "Rainbow") startRainbow();
    else if (effect == "Blink") startBlink();
    else if (effect == "Static") startStatic();
    else if (effect == "Fade") startFade();
    else if (effect == "Wipe") startWipe();
    else if (effect == "Color Cycle") startColorCycle();
    else if (effect == "Strobe") startStrobe();
  }
}

void stopEffect() {
  setupStrip();
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(0, 0, 0));
  }
  strip.show();
}
