import EffectManager from "../components/EffectManager";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  rejectUnauthorized: false,
});

export default function EffectsPage() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    socket.on("rssi_update", (data) => {
      setDevices((prev) => {
        const exists = prev.includes(data.id);
        return exists ? prev : [...prev, data.id];
      });
    });

    socket.on("device_disconnected", (data) => {
      setDevices((prev) => prev.filter((id) => id !== data.id));
    });

    return () => {
      socket.off("rssi_update");
      socket.off("device_disconnected");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <EffectManager connectedDevices={devices} socket={socket} />
    </div>
  );
}
