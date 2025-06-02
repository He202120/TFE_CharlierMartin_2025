import { useEffect, useState } from "react";
import { socket } from "../socket";

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

const defaultEffects = [
  { name: "Rainbow", effect: "Rainbow", isDefault: true },
  { name: "Blink", effect: "Blink", isDefault: true },
  { name: "Static", effect: "Static", isDefault: true },
  { name: "Wipe", effect: "Wipe", isDefault: true },
  { name: "Color Cycle", effect: "Color Cycle", isDefault: true },
  { name: "Strobe", effect: "Strobe", isDefault: true },
  { name: "HexaPulse", effect: "HexaPulse", isDefault: true },
  { name: "HexaWings", effect: "HexaWings", isDefault: true },
  { name: "RainbowSegment", effect: "RainbowSegment", isDefault: true },
];

export default function PilotTable() {
  const [rows, setRows] = useState(
    Array.from({ length: 4 }, () => ({
      active: false,
      band: "R",
      channel: 1,
      effect: "Rainbow",
      color: "#ffffff",
    }))
  );

  const [savedEffects, setSavedEffects] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [configName, setConfigName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    socket.emit("get_saved_effects");
    socket.emit("get_pilot_configs");

    socket.on("saved_effects", setSavedEffects);
    socket.on("pilot_configs", setSavedConfigs);
    socket.on("pilot_configs_updated", setSavedConfigs);
    socket.on("load_pilot_config_result", setRows);
    socket.on("config_save_error", (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 3000);
    });

    return () => {
      socket.off("saved_effects");
      socket.off("pilot_configs");
      socket.off("pilot_configs_updated");
      socket.off("load_pilot_config_result");
      socket.off("config_save_error");
    };
  }, []);

  const updateRow = (i, key, value) => {
    const updated = [...rows];
    updated[i][key] = value;
    setRows(updated);
  };

  const handleEffectChange = (i, selectedName) => {
    const found = [...defaultEffects, ...savedEffects].find((e) => e.name === selectedName);
    if (!found) return;
    updateRow(i, "effect", selectedName);
    updateRow(i, "color", found.color || "#ffffff");
  };

  const saveCurrentConfig = () => {
    if (!configName.trim()) {
      setErrorMessage("Veuillez entrer un nom de configuration.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const allEffects = [...defaultEffects, ...savedEffects];
    const fullRows = rows.map((row, index) => {
      const effectObj = allEffects.find((e) => e.name === row.effect);
      return {
        id: index + 1,
        active: row.active,
        band: row.band,
        channel: row.channel,
        frequency: bands[row.band][row.channel - 1],
        effect: effectObj?.effect || row.effect,
        color:
          effectObj?.isDefault && row.effect === "Static"
            ? row.color
            : effectObj?.color || null,
      };
    });

    socket.emit("save_pilot_config", { name: configName.trim(), config: fullRows });
    setConfigName("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const deleteConfig = (name) => {
    socket.emit("delete_pilot_config", name);
  };

  const loadConfig = (name) => {
    socket.emit("load_pilot_config", name);
  };

  return (
    <div className="p-4 text-white">
      <div className="flex gap-2 items-center mb-4">
        <input
          type="text"
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
          placeholder="Nom de la config"
          className="bg-gray-700 p-2 rounded w-64"
        />
        <button
          onClick={saveCurrentConfig}
          className={`${
            saveSuccess ? "bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"
          } text-black font-semibold px-4 py-2 rounded`}
        >
          {saveSuccess ? "Sauvegardé !" : "Sauvegarder la config"}
        </button>
      </div>

      {savedConfigs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Configurations existantes :</h3>
          <div className="flex flex-wrap gap-3">
            {savedConfigs.map((conf) => (
              <div
                key={conf.name}
                className="bg-gray-700 px-3 py-2 rounded flex items-center gap-2"
              >
                <span>{conf.name}</span>
                <button onClick={() => loadConfig(conf.name)} className="text-blue-400 underline">
                  Charger
                </button>
                <button
                  onClick={() => deleteConfig(conf.name)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && <div className="text-red-500 text-center mb-4">{errorMessage}</div>}

      <table className="w-full table-auto text-white border border-gray-600 mb-6 text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Actif</th>
            <th className="p-2 border">Bande</th>
            <th className="p-2 border">Channel</th>
            <th className="p-2 border">Fréquence</th>
            <th className="p-2 border">Effet</th>
            <th className="p-2 border">Couleur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const freq = bands[row.band][row.channel - 1] || "---";
            const selectedEffect = [...defaultEffects, ...savedEffects].find(
              (e) => e.name === row.effect
            );
            const isModifiable = selectedEffect?.isDefault;

            return (
              <tr key={i} className={`${row.active ? "bg-gray-800" : "bg-gray-900 opacity-50"}`}>
                <td className="p-2 border">{i + 1}</td>
                <td className="p-2 border text-center">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={() => updateRow(i, "active", !row.active)}
                  />
                </td>
                <td className="p-2 border">
                  <div className="flex flex-wrap gap-1">
                    {bandKeys.map((b) => (
                      <button
                        key={b}
                        disabled={!row.active}
                        onClick={() => updateRow(i, "band", b)}
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
                <td className="p-2 border">
                  <div className="flex flex-wrap gap-1">
                    {channelNumbers.map((c) => (
                      <button
                        key={c}
                        disabled={!row.active}
                        onClick={() => updateRow(i, "channel", c)}
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
                <td className="p-2 border text-green-400 text-center">
                  {row.active ? `${freq} MHz` : "---"}
                </td>
                <td className="p-2 border">
                  <select
                    value={row.effect}
                    onChange={(e) => handleEffectChange(i, e.target.value)}
                    disabled={!row.active}
                    className="bg-gray-700 text-white p-1 rounded w-full"
                  >
                    <optgroup label="Effets par défaut">
                      {defaultEffects.map((eff) => (
                        <option key={eff.name} value={eff.name}>
                          {eff.name}
                        </option>
                      ))}
                    </optgroup>
                    {savedEffects.length > 0 && (
                      <optgroup label="Effets enregistrés">
                        {savedEffects.map((eff) => (
                          <option key={eff.name} value={eff.name}>
                            {eff.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </td>
                <td className="p-2 border text-center">
                  {row.effect === "Static" && row.active && isModifiable ? (
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => updateRow(i, "color", e.target.value)}
                      className="w-10 h-6 bg-transparent border-none"
                    />
                  ) : row.effect === "Static" && !isModifiable ? (
                    <span
                      className="inline-block w-6 h-6 rounded"
                      style={{ backgroundColor: row.color }}
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
    </div>
  );
}
