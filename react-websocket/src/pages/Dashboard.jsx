import { useEffect, useState } from "react";
import io from "socket.io-client";
import DeviceCard from "../components/ESPList";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 2000,
  rejectUnauthorized: false,
});

export default function Dashboard() {
  const [devices, setDevices] = useState({});

  useEffect(() => {
    socket.on("rssi_update", (data) => {
      setDevices((prev) => ({ ...prev, [data.id]: data.rssi }));
    });

    socket.on("device_disconnected", (data) => {
      setDevices((prev) => {
        const updated = { ...prev };
        delete updated[data.id];
        return updated;
      });
    });

    return () => {
      socket.off("rssi_update");
      socket.off("device_disconnected");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 text-white px-4 py-6 w-full max-w-screen-xl mx-auto overflow-x-hidden">
      <h2 className="text-xl font-semibold mb-2">Appareils connectés</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {Object.entries(devices).map(([id, rssi]) => (
          <DeviceCard key={id} id={id} rssi={rssi} />
        ))}
      </div>
    </div>
  );
}
