import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  rejectUnauthorized: false,
});

const EFFECTS = [
  "Rainbow",
  "Blink",
  "Static",
  "Fade",
  "Wipe",
  "Color Cycle",
  "Strobe",
  "Off",
];

export default function EffectManager() {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [selectedEffect, setSelectedEffect] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);

  useEffect(() => {
    socket.on("rssi_update", (data) => {
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

    return () => {
      socket.off("rssi_update");
      socket.off("device_disconnected");
    };
  }, []);

  const toggleDevice = (id) => {
    if (selectedDevices.includes("ALL")) return;

    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedDevices(["ALL"]);
  };

  const clearSelection = () => {
    setSelectedDevices([]);
  };

  const handleApplyEffect = () => {
    if (!selectedEffect || selectedDevices.length === 0) return;

    socket.emit("set_effect", {
      effect: selectedEffect,
      targets: selectedDevices,
    });
  };

  const hasESP = connectedDevices.length > 0;
  const hasEffect = selectedEffect !== "";
  const hasSelection = selectedDevices.length > 0;
  const isDisabled = !hasESP || !hasEffect || !hasSelection;

  return (
    <div className="p-4 bg-gray-800 rounded shadow text-white">
      <h2 className="text-lg font-semibold mb-4">Effets lumineux</h2>

      <select
        value={selectedEffect}
        onChange={(e) => setSelectedEffect(e.target.value)}
        className="bg-gray-700 p-2 rounded mb-4 w-full"
      >
        <option value="">Choisir un effet</option>
        {EFFECTS.map((effect) => (
          <option key={effect} value={effect}>
            {effect}
          </option>
        ))}
      </select>

      <div className="mb-4">
        <p className="mb-2">Cibles :</p>

        {hasESP ? (
          <>
            <div className="flex gap-2 mb-2">
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

      <button
        onClick={handleApplyEffect}
        disabled={isDisabled}
        className={`mt-4 px-4 py-2 rounded w-full font-semibold ${
          isDisabled
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Appliquer
      </button>
    </div>
  );
}
