import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO
import paho.mqtt.client as mqtt
import time
import threading
import json
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

MQTT_BROKER = "192.168.4.1"
MQTT_PORT = 1883
MQTT_TOPIC_RSSI = "esp32/rssi"
MQTT_TOPIC_LIMITS = "esp32/config/rssi"
MQTT_USER = "esp32_client"
MQTT_PASS = "esp32CLIENT"

devices = {}
pilot_config = []
last_sent_config = {}
race_running = False
race_start_time = None
effects_store_path = "effects.json"
pilot_config_store_path = "configs.json"

def on_connect(client, userdata, flags, rc):
    print("MQTT connecté au broker")
    client.subscribe(MQTT_TOPIC_RSSI)
    client.subscribe("esp32/+/spectro")
    client.subscribe("esp32/hello")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()

    if msg.topic == "esp32/hello":
        device_id = payload.strip()
        if device_id not in devices:
            print(f"ESP connecté : {device_id}")
        devices[device_id] = {
            "rssi": 0,
            "last_seen": time.time()
        }
        socketio.emit("device_connected", {"id": device_id})
        return

    if msg.topic.endswith("/spectro"):
        try:
            data = json.loads(payload)
            socketio.emit("spectro_data", data)
        except Exception as e:
            print("Erreur spectro_data:", e)
        return

    parts = payload.split(":")
    if len(parts) >= 2:
        device_id = parts[0]
        rssi = parts[-1]
        devices[device_id] = {
            "rssi": int(rssi),
            "last_seen": time.time()
        }
        socketio.emit("rssi_update", {
            "id": device_id,
            "rssi": int(rssi),
            "last_seen": devices[device_id]["last_seen"]
        })

def clean_inactive_devices():
    while True:
        now = time.time()
        inactive = [
            device_id for device_id, data in devices.items()
            if now - data["last_seen"] > 2
        ]
        for device_id in inactive:
            del devices[device_id]
            last_sent_config.pop(device_id, None)
            print(f"Déconnexion détectée : {device_id}")
            socketio.emit("device_disconnected", {"id": device_id})
        time.sleep(5)

threading.Thread(target=clean_inactive_devices, daemon=True).start()

mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

@socketio.on("set_rssi_limits")
def handle_set_rssi_limits(data):
    message = f"{data['min']}:{data['max']}"
    mqtt_client.publish(MQTT_TOPIC_LIMITS, message)

@socketio.on("set_effect")
def handle_set_effect(data):
    global race_running

    if race_running:
        print("Refusé : Effets désactivés pendant la course.")
        socketio.emit("effect_error", "Impossible de changer les effets pendant la course.")
        return

    effect = data.get("effect")
    targets = data.get("targets", [])
    params = data.get("params", {})

    print(f"Reçu set_effect → effet: {effect} | cibles: {targets} | paramètres: {params}")

    if not effect or not isinstance(targets, list):
        return

    payload = {"effect": effect}
    payload.update(params)

    if "ALL" in targets:
        mqtt_client.publish("esp32/effect", json.dumps(payload))
        print(f"Effet '{effect}' envoyé à TOUS avec paramètres: {params}")
    else:
        for target in targets:
            topic = f"esp32/{target}/effect"
            mqtt_client.publish(topic, json.dumps(payload))
            print(f"Effet '{effect}' envoyé à {target} avec paramètres: {params}")

@socketio.on("save_effect_to_backend")
def save_effect_to_backend(data):
    try:
        with open(effects_store_path, "r") as f:
            effects = json.load(f)
    except:
        effects = []

    name = data.get("name")
    if any(e.get("name") == name for e in effects):
        socketio.emit("effect_save_error", f"Un effet nommé « {name} » existe déjà.")
        return

    effects.append(data)

    with open(effects_store_path, "w") as f:
        json.dump(effects, f)

    socketio.emit("effects_updated", effects)

@socketio.on("delete_effect_from_backend")
def delete_effect_from_backend(name):
    try:
        with open(effects_store_path, "r") as f:
            effects = json.load(f)
    except:
        effects = []

    effects = [e for e in effects if e.get("name") != name]

    with open(effects_store_path, "w") as f:
        json.dump(effects, f)

    socketio.emit("effects_updated", effects)

@socketio.on("get_saved_effects")
def get_saved_effects():
    try:
        with open(effects_store_path, "r") as f:
            effects = json.load(f)
    except:
        effects = []

    socketio.emit("saved_effects", effects)

@socketio.on("save_pilot_config")
def save_pilot_config(data):
    name = data.get("name")
    config = data.get("config")

    if not name or not config:
        return

    try:
        with open(pilot_config_store_path, "r") as f:
            configs = json.load(f)
    except:
        configs = []

    if any(c["name"] == name for c in configs):
        socketio.emit("config_save_error", f"Une configuration nommée « {name} » existe déjà.")
        return

    configs.append({ "name": name, "config": config })

    with open(pilot_config_store_path, "w") as f:
        json.dump(configs, f)

    socketio.emit("pilot_configs_updated", configs)

@socketio.on("get_pilot_configs")
def get_pilot_configs():
    try:
        with open(pilot_config_store_path, "r") as f:
            configs = json.load(f)
    except:
        configs = []

    socketio.emit("pilot_configs", configs)

@socketio.on("delete_pilot_config")
def delete_pilot_config(name):
    try:
        with open(pilot_config_store_path, "r") as f:
            configs = json.load(f)
    except:
        configs = []

    configs = [c for c in configs if c["name"] != name]

    with open(pilot_config_store_path, "w") as f:
        json.dump(configs, f)

    socketio.emit("pilot_configs_updated", configs)

@socketio.on("load_pilot_config")
def load_pilot_config(name):
    try:
        with open(pilot_config_store_path, "r") as f:
            configs = json.load(f)
    except:
        configs = []

    for conf in configs:
        if conf["name"] == name:
            socketio.emit("load_pilot_config_result", conf["config"])
            return

@socketio.on("set_pilots")
def handle_set_pilots(data):
    global pilot_config
    pilot_config = data
    socketio.emit("pilot_config", pilot_config)

    config = {
        "frequencies": [],
        "effects": [],
        "colors": []
    }

    for pilot in data:
        if not pilot.get("active"):
            continue
        config["frequencies"].append(pilot.get("frequency", 0))
        config["effects"].append(pilot.get("effect", ""))
        config["colors"].append(pilot.get("color", ""))

    config_json = json.dumps(config)

    for device_id in devices.keys():
        if last_sent_config.get(device_id) != config_json:
            mqtt_client.publish(f"esp32/{device_id}/config", config_json)
            last_sent_config[device_id] = config_json
            print(f"MQTT → {device_id} : configuration mise à jour")

@socketio.on("get_current_pilots")
def handle_get_current_pilots():
    socketio.emit("pilot_config", pilot_config)

@socketio.on("start_race")
def handle_start_race():
    global race_running, race_start_time
    race_running = True
    race_start_time = time.time()
    print(">>> Course démarrée via front-end")
    mqtt_client.publish("esp32/race", "start")

@socketio.on("stop_race")
def handle_stop_race():
    global race_running, race_start_time
    race_running = False
    race_start_time = None
    mqtt_client.publish("esp32/race", "stop")
    socketio.emit("stop_race")

@socketio.on("get_race_status")
def handle_race_status():
    global race_running, race_start_time
    if race_running and race_start_time:
        elapsed = int(time.time() - race_start_time)
        socketio.emit("race_status", {"status": "running", "time": elapsed})
    else:
        socketio.emit("race_status", {"status": "stopped", "time": 0})

@app.route("/")
def index():
    return "MQTT + Flask-SocketIO actif"

if __name__ == "__main__":
    mqtt_client.loop_start()
    socketio.run(app, host="0.0.0.0", port=5000)