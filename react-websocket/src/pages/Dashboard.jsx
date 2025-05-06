import { useEffect, useState } from "react";
import io from "socket.io-client";
import DeviceCard from "../components/ESPList";
import RssiSettings from "../components/RSSISettings";

// ✅ Connexion correcte vers Flask sur le bon port
const socket = io("http://192.168.4.1:5000", {
  transports: ["websocket"],
});

// ✅ Logs pour déboguer la connexion
socket.on("connect", () => {
  console.log("✅ WebSocket connecté !");
});

socket.on("connect_error", (err) => {
  console.error("❌ Erreur Socket.IO :", err.message);
});

export default function Dashboard() {
  const [devices, setDevices] = useState({});
  const [minRssi, setMinRssi] = useState(200);
  const [maxRssi, setMaxRssi] = useState(800);

  useEffect(() => {
    socket.on("rssi_update", (data) => {
      console.log("📡 Donnée reçue :", data);
      setDevices((prev) => ({ ...prev, [data.id]: data.rssi }));
    });

    return () => {
      socket.off("rssi_update");
    };
  }, []);

  const applyRssiLimits = () => {
    socket.emit("set_rssi_limits", { min: minRssi, max: maxRssi });
  };

  return (
    <div className="p-4">
      <RssiSettings
        min={minRssi}
        max={maxRssi}
        setMin={setMinRssi}
        setMax={setMaxRssi}
        onApply={applyRssiLimits}
      />

      <h2 className="text-xl font-semibold mb-2 text-white">📶 Appareils connectés</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(devices).map(([id, rssi]) => (
          <DeviceCard key={id} id={id} rssi={rssi} />
        ))}
      </div>
    </div>
  );
}
