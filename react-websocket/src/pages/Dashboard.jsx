import { useEffect, useState } from "react";
import io from "socket.io-client";
import DeviceCard from "../components/ESPList";
import RssiSettings from "../components/RSSISettings";

const socket = io("https://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 2000,
  rejectUnauthorized: false,
});

export default function Dashboard() {
  const [devices, setDevices] = useState({});
  const [minRssi, setMinRssi] = useState(200);
  const [maxRssi, setMaxRssi] = useState(800);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", () => {
      console.warn("Impossible de se connecter à Flask (WebSocket)");
    });

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
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error");
      socket.off("rssi_update");
      socket.off("device_disconnected");
    };
  }, []);

  const applyRssiLimits = () => {
    socket.emit("set_rssi_limits", { min: minRssi, max: maxRssi });
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white px-4 py-6 w-full max-w-screen-xl mx-auto overflow-x-hidden">
      {isSocketConnected === false && (
        <p className="text-yellow-400 mb-4 text-center">Backend non connecté</p>
      )}

      <RssiSettings
        min={minRssi}
        max={maxRssi}
        setMin={setMinRssi}
        setMax={setMaxRssi}
        onApply={applyRssiLimits}
      />

      <h2 className="text-xl font-semibold mb-2">Appareils connectés</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {Object.entries(devices).map(([id, rssi]) => (
          <DeviceCard key={id} id={id} rssi={rssi} />
        ))}
      </div>
    </div>
  );
}
