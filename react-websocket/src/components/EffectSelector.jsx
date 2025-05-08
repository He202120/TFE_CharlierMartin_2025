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

export default function EffectSelector() {
  const [selected, setSelected] = useState(null);

  const handleSelect = (effect, event) => {
    setSelected(effect);
    event.target.blur(); // retire le focus pour forcer le redraw
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-white">Liste des effets disponibles</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {effects.map((effect) => (
          <button
            key={effect}
            onClick={(e) => handleSelect(effect, e)}
            className={`px-3 py-2 rounded text-white transition ${
              selected === effect ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {effect}
          </button>
        ))}
      </div>

      {selected && (
        <p className="mt-4 text-center text-white">
          Effet sélectionné : <span className="font-semibold">{selected}</span>
        </p>
      )}
    </div>
  );
}
