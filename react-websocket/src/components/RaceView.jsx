import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";

export default function RaceView() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState("");
  const [appliedConfig, setAppliedConfig] = useState(localStorage.getItem("appliedConfig") || "");
  const [pilots, setPilots] = useState([]);
  const [lastGate, setLastGate] = useState({});
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    socket.emit("get_pilot_configs");
    socket.emit("get_race_status");

    socket.on("pilot_configs", setConfigs);

    socket.on("race_status", ({ status, time }) => {
      setRunning(status === "running");
      setTime(time);
      if (status === "running" && !intervalRef.current) {
        startTimer(time);
      }
    });

    socket.on("pilot_config", (data) => {
      const activePilots = data.filter((p) => p.active);
      setPilots(activePilots);
      setLastGate({});
    });

    socket.on("pilot_pass", ({ frequency, device }) => {
      const pilot = pilots.find((p) => p.frequency === frequency);
      if (!pilot) return;
      setLastGate((prev) => ({
        ...prev,
        [pilot.id]: device || "???",
      }));
    });

    socket.on("stop_race", () => {
      stopTimer();
      setRunning(false);
      localStorage.removeItem("appliedConfig");
    });

    if (localStorage.getItem("appliedConfig")) {
      const confName = localStorage.getItem("appliedConfig");
      setSelectedConfig(confName);
      setAppliedConfig(confName);
      socket.once("pilot_configs", (data) => {
        const conf = data.find((c) => c.name === confName);
        if (conf) socket.emit("set_pilots", conf.config);
      });
    }

    return () => {
      socket.off("pilot_configs");
      socket.off("pilot_config");
      socket.off("pilot_pass");
      socket.off("race_status");
      socket.off("stop_race");
      stopTimer();
    };
  }, [pilots]);

  const startTimer = (initialTime = 0) => {
    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    setTime(initialTime);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const applyConfig = () => {
    const configObj = configs.find((c) => c.name === selectedConfig);
    if (!configObj) return;
    socket.emit("set_pilots", configObj.config);
    setAppliedConfig(selectedConfig);
    localStorage.setItem("appliedConfig", selectedConfig);
  };

  const startRace = () => {
    if (!appliedConfig) {
      alert("Veuillez d'abord appliquer une configuration de pilotes.");
      return;
    }
    socket.emit("start_race");
    setLastGate({});
    setRunning(true);
    setTime(0);
    stopTimer();
    startTimer();
  };

  const stopRace = () => {
    socket.emit("stop_race");
    stopTimer();
    setRunning(false);
  };

  const formatTime = (t) => {
    const min = String(Math.floor(t / 60)).padStart(2, "0");
    const sec = String(t % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Choisir une configuration de pilotes :</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
            disabled={running}
            className="p-2 rounded bg-gray-700 text-white"
          >
            <option value="">-- Sélectionnez une configuration --</option>
            {configs.map((conf) => (
              <option key={conf.name} value={conf.name}>
                {conf.name}
              </option>
            ))}
          </select>
          <button
            onClick={applyConfig}
            disabled={!selectedConfig || selectedConfig === appliedConfig || running}
            className={`px-4 py-2 rounded text-white font-semibold ${
              !selectedConfig || selectedConfig === appliedConfig || running
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Appliquer à la course
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={startRace}
            disabled={running}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold mr-4 disabled:opacity-50"
          >
            Démarrer la course
          </button>
          <button
            onClick={stopRace}
            disabled={!running}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold disabled:opacity-50"
          >
            Arrêter la course
          </button>
        </div>
        <div className="text-2xl font-mono">
          Chronomètre : <span className="text-yellow-300">{formatTime(time)}</span>
        </div>
      </div>

      <table className="w-full text-sm table-auto border border-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-2 border border-gray-600 text-left">#</th>
            <th className="p-2 border border-gray-600 text-left">Pilote</th>
            <th className="p-2 border border-gray-600 text-left">Bande</th>
            <th className="p-2 border border-gray-600 text-left">Channel</th>
            <th className="p-2 border border-gray-600 text-left">Fréquence</th>
            <th className="p-2 border border-gray-600 text-left">Dernière porte</th>
          </tr>
        </thead>
        <tbody>
          {pilots.map((pilot) => (
            <tr key={pilot.id} className="bg-gray-800">
              <td className="p-2 border border-gray-700">{pilot.id}</td>
              <td className="p-2 border border-gray-700">Pilote {pilot.id}</td>
              <td className="p-2 border border-gray-700">{pilot.band}</td>
              <td className="p-2 border border-gray-700">{pilot.channel}</td>
              <td className="p-2 border border-gray-700 font-mono text-green-400">
                {pilot.frequency} MHz
              </td>
              <td className="p-2 border border-gray-700 font-bold text-yellow-400">
                {lastGate[pilot.id] || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
