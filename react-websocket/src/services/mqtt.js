// src/mqtt.js
import mqtt from 'mqtt';

// Créer une connexion au broker via WebSocket sur le port 9001
const client = mqtt.connect('ws://localhost:9001'); // Utilisation de WebSocket

// Gestion de la connexion
client.on('connect', () => {
  console.log('Connecté au broker MQTT via WebSocket');
});

// Gestion des erreurs
client.on('error', (err) => {
  console.error('Erreur de connexion MQTT:', err);
});

// Fonction pour envoyer un message à un topic
const sendMessage = (topic, message) => {
    // Si tu veux envoyer un message au format JSON
    const jsonMessage = JSON.stringify({ message: message }); // Transforme ton message en JSON
  
    client.publish(topic, jsonMessage, { qos: 0, retain: false }, (err) => {
      if (err) {
        console.error('Erreur lors de l\'envoi du message:', err);
      } else {
        console.log(`Message JSON envoyé sur ${topic}: ${jsonMessage}`);
      }
    });
  };

// Exporter la fonction pour utilisation dans React
export { sendMessage };
