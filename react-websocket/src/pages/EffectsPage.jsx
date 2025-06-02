import { useEffect, useState } from "react";
import { socket } from "../socket";
import EffectManager from "../components/EffectManager";

export default function EffectsPage() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    socket.emit("get_race_status");

    socket.on("rssi_update", (data) => {
      setDevices((prev) => (prev.includes(data.id) ? prev : [...prev, data.id]));
    });

    socket.on("device_connected", (data) => {
      setDevices((prev) => (prev.includes(data.id) ? prev : [...prev, data.id]));
    });

    socket.on("device_disconnected", (data) => {
      setDevices((prev) => prev.filter((id) => id !== data.id));
    });

    return () => {
      socket.off("rssi_update");
      socket.off("device_connected");
      socket.off("device_disconnected");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <EffectManager />
    </div>
  );
}
