export default function DeviceCard({ id, rssi }) {
    return (
      <div className="p-4 bg-gray-800 rounded shadow flex justify-between items-center">
        <div className="font-mono text-white">{id}</div>
        <div className="text-green-400 font-bold">RSSI: {rssi}</div>
      </div>
    );
  }
  