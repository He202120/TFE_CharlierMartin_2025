#include <WiFi.h>
#include <PubSubClient.h>

// 📌 Configurer le WiFi
const char* ssid = "APFlyToBeALight";  
const char* password = "FLYTOBEALIGHT";  

// 📌 Configurer le MQTT
const char* mqtt_server = "192.168.4.1";  // IP du Raspberry
const int mqtt_port = 1883;
const char* mqtt_user = "esp32_client";  
const char* mqtt_password = "esp32CLIENT";  

WiFiClient espClient;
PubSubClient client(espClient);

// 📌 Configuration de la LED
const int ledPin = 2;  // GPIO2 pour la LED intégrée de l'ESP32

// 📌 Fonction de connexion Wi-Fi
void setup_wifi() {
  Serial.print("Connexion au WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connecté au WiFi !");
}

// 📌 Fonction de connexion MQTT
void reconnect_mqtt() {
  while (!client.connected()) {
    if (client.connect("ESP32_Client", mqtt_user, mqtt_password)) {
      Serial.println("Connecté au MQTT !");
      client.subscribe("esp32/led");  // S'abonne au topic pour recevoir les messages
    } else {
      delay(5000);
    }
  }
}

// 📌 Fonction pour allumer/éteindre la LED
void setLEDState(String state) {
  if (state == "on") {
    digitalWrite(ledPin, HIGH);  // Allume la LED
  } else if (state == "off") {
    digitalWrite(ledPin, LOW);   // Éteint la LED
  }
}

// 📌 Fonction de gestion des messages MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (String(topic) == "esp32/led") {
    setLEDState(message);  // Modifie l'état de la LED en fonction du message
  }
}

void setup() {
  Serial.begin(115200);

  // Initialisation de la LED
  pinMode(ledPin, OUTPUT);
  
  // Connexion au Wi-Fi
  setup_wifi();

  // Connexion au MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  reconnect_mqtt();
}

void loop() {
  // Si l'ESP32 n'est pas connecté, se reconnecter
  if (!client.connected()) {
    reconnect_mqtt();
  }
  
  // Traiter les messages MQTT
  client.loop();
}
