import { useState } from "react";

const effects = [
  "Rainbow",
  "Blink",
  "Static",
  "Fade",
  "Wipe",
  "Color Cycle",
  "Strobe",
];

export default function EffectManager({ connectedDevices, socket }) {
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleDevice = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSelectAll = () => {
    setSelectAll((prev) => !prev);
    setSelectedDevices([]);
  };

  const handleApply = () => {
    if (!selectedEffect) return;

    const targets = selectAll ? ["ALL"] : selectedDevices;
    socket.emit("set_effect", {
      effect: selectedEffect,
      targets,
    });
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Sélection d’effet</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {effects.map((effect) => (
          <button
            key={effect}
            onClick={() => setSelectedEffect(effect)}
            className={`px-3 py-2 rounded text-white transition ${
              selectedEffect === effect ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {effect}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
          />
          Tous les ESP32
        </label>
      </div>

      {!selectAll && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {connectedDevices.map((deviceId) => (
            <label
              key={deviceId}
              className="flex items-center gap-2 text-white bg-gray-700 rounded px-2 py-1"
            >
              <input
                type="checkbox"
                checked={selectedDevices.includes(deviceId)}
                onChange={() => toggleDevice(deviceId)}
              />
              {deviceId}
            </label>
          ))}
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={!selectedEffect || (!selectAll && selectedDevices.length === 0)}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Appliquer
      </button>
    </div>
  );
}
