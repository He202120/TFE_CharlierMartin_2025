import { useState } from "react";
import ESPList from "../components/ESPList";

export default function Dashboard() {
  const [selectedESP, setSelectedESP] = useState(null);

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">ESP32 Connectés</h2>
      <ESPList onSelect={setSelectedESP} selected={selectedESP} />
    </div>
  );
}
