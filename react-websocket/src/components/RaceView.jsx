import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  rejectUnauthorized: false,
});

export default function RaceManager() {
  const [pilots, setPilots] = useState([]);
  const [laps, setLaps] = useState({});
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    socket.on("pilot_config", (data) => {
      setPilots(data); 
      setLaps({});
      setTime(0);
      setRunning(false);
    });

    socket.on("pilot_pass", ({ frequency }) => {
      const pilot = pilots.find((p) => p.frequency === frequency);
      if (!pilot) return;

      setLaps((prev) => ({
        ...prev,
        [pilot.id]: (prev[pilot.id] || 0) + 1,
      }));
    });

    return () => {
      socket.off("pilot_config");
      socket.off("pilot_pass");
    };
  }, [pilots]);

  const startRace = () => {
    socket.emit("start_race");
    setRunning(true);
    setTime(0);
    setLaps({});
    const id = setInterval(() => setTime((prev) => prev + 1), 1000);
    setIntervalId(id);
  };

  const stopRace = () => {
    socket.emit("stop_race");
    setRunning(false);
    clearInterval(intervalId);
  };

  const formatTime = (t) => {
    const min = String(Math.floor(t / 60)).padStart(2, "0");
    const sec = String(t % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={startRace}
            disabled={running}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold mr-4 disabled:opacity-50"
          >
            Start Race
          </button>
          <button
            onClick={stopRace}
            disabled={!running}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold disabled:opacity-50"
          >
            Stop Race
          </button>
        </div>
        <div className="text-2xl font-mono">
          Race Clock : <span className="text-yellow-300">{formatTime(time)}</span>
        </div>
      </div>

      <table className="w-full text-sm table-auto border border-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-2 border border-gray-600 text-left">#</th>
            <th className="p-2 border border-gray-600 text-left">Pilote</th>
            <th className="p-2 border border-gray-600 text-left">Band</th>
            <th className="p-2 border border-gray-600 text-left">Channel</th>
            <th className="p-2 border border-gray-600 text-left">Fréquence</th>
            <th className="p-2 border border-gray-600 text-left">Laps</th>
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
                {laps[pilot.id] || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
