import { useState } from "react";
import io from "socket.io-client";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  rejectUnauthorized: false,
});

const bands = {
  L: [5362, 5399, 5436, 5473, 5510, 5547, 5584, 5621],
  R: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
  F: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  A: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  B: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  E: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
};

const bandKeys = Object.keys(bands);
const channelNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const effects = [
  "Rainbow",
  "Blink",
  "Static",
  "Fade",
  "Wipe",
  "Color Cycle",
  "Strobe",
];

export default function PilotTable() {
  const [rows, setRows] = useState(
    Array.from({ length: 8 }, () => ({
      active: false,
      band: "R",
      channel: 1,
      effect: "Rainbow",
      color: "#ffffff",
    }))
  );

  const updateRow = (i, key, value) => {
    const updated = [...rows];
    updated[i][key] = value;
    setRows(updated);
  };

  const handleSend = () => {
    const payload = rows
      .map((row, index) => ({
        id: index + 1,
        active: row.active,
        band: row.band,
        channel: row.channel,
        frequency: bands[row.band][row.channel - 1],
        effect: row.effect,
        color: row.effect === "Static" ? row.color : null,
      }))
      .filter((p) => p.active);

    socket.emit("set_pilots", payload);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-white border border-gray-600 mb-6 text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-2 border border-gray-600">#</th>
            <th className="p-2 border border-gray-600">Enable</th>
            <th className="p-2 border border-gray-600">Band</th>
            <th className="p-2 border border-gray-600">Channel</th>
            <th className="p-2 border border-gray-600">Fréquence</th>
            <th className="p-2 border border-gray-600">Effet</th>
            <th className="p-2 border border-gray-600">Couleur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const freq = bands[row.band][row.channel - 1] || "---";
            return (
              <tr
                key={i}
                className={`${row.active ? "bg-gray-800" : "bg-gray-900 opacity-50"}`}
              >
                <td className="p-2 border border-gray-700 font-mono">{i + 1}</td>
                <td className="p-2 border border-gray-700">
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={row.active}
                        onChange={() => updateRow(i, "active", !row.active)}
                      />
                      <div className="w-12 h-6 bg-yellow-500 rounded-full peer peer-checked:bg-yellow-400 transition-all duration-200" />
                      <div className="absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-6 transition-all duration-200" />
                    </span>
                  </label>
                </td>

                <td className="p-2 border border-gray-700">
                  <div className="flex gap-1 flex-wrap">
                    {bandKeys.map((b) => (
                      <button
                        key={b}
                        onClick={() => updateRow(i, "band", b)}
                        disabled={!row.active}
                        className={`px-2 py-1 border rounded w-8 ${
                          row.band === b
                            ? "bg-yellow-400 text-black font-bold"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </td>

                <td className="p-2 border border-gray-700">
                  <div className="flex gap-1 flex-wrap">
                    {channelNumbers.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateRow(i, "channel", c)}
                        disabled={!row.active}
                        className={`px-2 py-1 border rounded w-8 ${
                          row.channel === c
                            ? "bg-yellow-400 text-black font-bold"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </td>

                <td className="p-2 border border-gray-700 font-mono text-green-400">
                  {row.active ? `${freq} MHz` : "---"}
                </td>

                <td className="p-2 border border-gray-700">
                  <select
                    value={row.effect}
                    onChange={(e) => updateRow(i, "effect", e.target.value)}
                    disabled={!row.active}
                    className="bg-gray-700 text-white p-1 rounded"
                  >
                    {effects.map((eff) => (
                      <option key={eff} value={eff}>
                        {eff}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-2 border border-gray-700 text-center">
                  {row.effect === "Static" && row.active ? (
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => updateRow(i, "color", e.target.value)}
                      className="w-10 h-6 bg-transparent border-none"
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-center">
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
        >
          Enregistrer pour la course
        </button>
      </div>
    </div>
  );
}
