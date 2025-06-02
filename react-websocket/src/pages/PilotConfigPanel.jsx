import { useState } from "react";
import PilotTable from "../components/PilotTable";

export default function PilotConfigPanel() {
  const [numPilots, setNumPilots] = useState(4);

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold">Gestion des pilotes</h1>
      </div>

      <PilotTable numPilots={numPilots} />
    </div>
  );
}
