export default function DeviceCard({ id, rssi }) {
  return (
    <div className="p-4 bg-gray-800 rounded shadow flex justify-between items-center">
      <div className="text-white font-mono">{id}</div>
      <div className="text-gray-400">RSSI: {rssi}</div>
    </div>
  );
}
