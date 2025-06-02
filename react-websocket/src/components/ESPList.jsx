import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function ESPList({ onSelect, selected }) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    socket.on("device_connected", ({ id }) => {
      setDevices((prev) => (prev.includes(id) ? prev : [...prev, id]));
    });

    socket.on("device_disconnected", ({ id }) => {
      setDevices((prev) => prev.filter((d) => d !== id));
    });

    return () => {
      socket.off("device_connected");
      socket.off("device_disconnected");
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-3">
      {devices.map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`px-4 py-2 rounded font-semibold ${
            selected === id ? "bg-yellow-400 text-black" : "bg-gray-700 text-white"
          }`}
        >
          {id}
        </button>
      ))}
    </div>
  );
}
