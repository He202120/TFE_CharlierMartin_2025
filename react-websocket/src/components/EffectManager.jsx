import { useEffect, useState } from "react";
import { socket } from "../socket";

const EFFECTS = [
  { id: "Rainbow", label: "Arc-en-ciel", speed: true, color: false },
  { id: "Blink", label: "Clignotement", speed: true, color: true },
  { id: "Static", label: "Fixe", speed: false, color: true },
  { id: "Wipe", label: "Balayage", speed: true, color: true },
  { id: "Color Cycle", label: "Cycle de couleurs", speed: true, color: false },
  { id: "Strobe", label: "Stroboscope", speed: true, color: true },
  { id: "HexaPulse", label: "HexaPulse", speed: true, color: true },
  { id: "HexaWings", label: "HexaWings", speed: true, color: true },
  { id: "RainbowSegment", label: "RainbowSegment", speed: true, color: false },
];

export default function EffectManager() {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [selectedEffect, setSelectedEffect] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [color, setColor] = useState("#ffffff");
  const [speed, setSpeed] = useState(50);
  const [intensity, setIntensity] = useState(50);
  const [savedEffects, setSavedEffects] = useState([]);
  const [effectName, setEffectName] = useState("");
  const [isRaceRunning, setIsRaceRunning] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    socket.emit("get_saved_effects");
    socket.emit("get_race_status");

    socket.on("saved_effects", setSavedEffects);
    socket.on("effects_updated", setSavedEffects);
    socket.on("effect_save_error", showErrorMessage);

    socket.on("rssi_update", (data) => {
      setConnectedDevices((prev) => {
        const updated = new Set(prev);
        updated.add(data.id);
        return Array.from(updated);
      });
    });

    socket.on("device_connected", (data) => {
      setConnectedDevices((prev) => {
        const updated = new Set(prev);
        updated.add(data.id);
        return Array.from(updated);
      });
    });

    socket.on("device_disconnected", (data) => {
      setConnectedDevices((prev) => prev.filter((id) => id !== data.id));
      setSelectedDevices((prev) => prev.filter((id) => id !== data.id));
    });

    socket.on("pilot_config", () => setIsRaceRunning(true));
    socket.on("stop_race", () => setIsRaceRunning(false));
    socket.on("race_status", (data) => setIsRaceRunning(data.status === "running"));

    return () => {
      socket.off("saved_effects");
      socket.off("effects_updated");
      socket.off("effect_save_error");
      socket.off("rssi_update");
      socket.off("device_connected");
      socket.off("device_disconnected");
      socket.off("pilot_config");
      socket.off("stop_race");
      socket.off("race_status");
    };
  }, []);

  const showErrorMessage = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
    setTimeout(() => setShowError(false), 4000);
  };

  const toggleDevice = (id) => {
    if (selectedDevices.includes("ALL")) return;
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedDevices(["ALL"]);
  const clearSelection = () => setSelectedDevices([]);

  const handleApplyEffect = () => {
    if (!selectedEffect || selectedDevices.length === 0) return;
    if (isRaceRunning) {
      showErrorMessage("Impossible : la course est en cours.");
      return;
    }

    socket.emit("set_effect", {
      effect: selectedEffect,
      targets: selectedDevices,
      params: { color, speed, intensity },
    });
  };

  const handleStopEffect = () => {
    socket.emit("set_effect", {
      effect: "Off",
      targets: selectedDevices,
    });
  };

  const saveEffect = () => {
    if (!effectName.trim()) {
      showErrorMessage("Veuillez entrer un nom avant de sauvegarder.");
      return;
    }

    const current = EFFECTS.find((e) => e.id === selectedEffect);
    if (!current) return;

    const newEffect = {
      name: effectName,
      effect: current.id,
      color,
      speed,
      intensity,
    };

    socket.emit("save_effect_to_backend", newEffect);
    setEffectName("");
  };

  const deleteEffect = (name) => {
    socket.emit("delete_effect_from_backend", name);
  };

  const loadEffect = (effect) => {
    setSelectedEffect(effect.effect);
    setColor(effect.color);
    setSpeed(effect.speed);
    setIntensity(effect.intensity);
    setEffectName(effect.name);
  };

  const currentEffect = EFFECTS.find((e) => e.id === selectedEffect);
  const isDisabled = !selectedEffect || selectedDevices.length === 0;

  return (
    <div className="p-4 bg-gray-800 rounded shadow text-white max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Effets lumineux</h2>

      {showError && (
        <div className="mb-4 bg-red-600 text-white px-4 py-2 rounded shadow">
          {errorMessage}
        </div>
      )}

      <select
        value={selectedEffect}
        onChange={(e) => setSelectedEffect(e.target.value)}
        className="bg-gray-700 p-2 rounded mb-4 w-full"
      >
        <option value="">Choisir un effet</option>
        {EFFECTS.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>

      {currentEffect?.color && (
        <div className="mb-4">
          <label className="block mb-2">Couleur :</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 rounded"
          />
        </div>
      )}

      {currentEffect?.speed && (
        <div className="mb-4">
          <label className="block mb-2">Vitesse : {speed}</label>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">Intensité : {intensity}</label>
        <input
          type="range"
          min="1"
          max="100"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Nom de l'effet :</label>
        <input
          type="text"
          value={effectName}
          onChange={(e) => setEffectName(e.target.value)}
          className="bg-gray-700 p-2 rounded w-full"
        />
      </div>

      <div className="mb-4">
        <p className="mb-2">Cibles :</p>
        {connectedDevices.length > 0 ? (
          <>
            <div className="flex gap-2 mb-2 flex-wrap">
              <button onClick={selectAll} className="text-sm text-blue-400 underline">
                Tous les ESP
              </button>
              <button onClick={clearSelection} className="text-sm text-red-400 underline">
                Effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {connectedDevices.map((id) => (
                <label key={id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    disabled={selectedDevices.includes("ALL")}
                    checked={selectedDevices.includes("ALL") || selectedDevices.includes(id)}
                    onChange={() => toggleDevice(id)}
                  />
                  {id}
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Aucun ESP32 connecté</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={handleApplyEffect}
          disabled={isDisabled}
          className={`flex-1 px-4 py-2 rounded font-semibold ${
            isDisabled ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Appliquer
        </button>
        <button
          onClick={handleStopEffect}
          disabled={selectedDevices.length === 0}
          className="flex-1 px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-semibold"
        >
          Stop Effet
        </button>
        <button
          onClick={saveEffect}
          disabled={!selectedEffect}
          className="flex-1 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 font-semibold text-black"
        >
          Sauvegarder cet effet
        </button>
      </div>

      {savedEffects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Effets enregistrés</h3>
          <div className="flex flex-wrap gap-2">
            {savedEffects.map((eff) => (
              <div key={eff.name} className="bg-gray-700 rounded p-2 flex items-center gap-3">
                <button onClick={() => loadEffect(eff)} className="text-white underline">
                  {eff.name}
                </button>
                <button
                  onClick={() => deleteEffect(eff.name)}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
