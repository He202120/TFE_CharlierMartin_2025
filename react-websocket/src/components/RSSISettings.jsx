export default function RssiSettings({ min, max, setMin, setMax, onApply }) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-white">🎯 Paramètres RSSI</h2>
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white"
            placeholder="RSSI Min"
          />
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white"
            placeholder="RSSI Max"
          />
          <button
            onClick={onApply}
            className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700 text-white"
          >
            Appliquer
          </button>
        </div>
      </div>
    );
  }
  