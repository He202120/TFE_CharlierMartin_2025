export default function RssiSettings({ min, max, setMin, setMax, onApply }) {
  return (
    <div className="mb-6 w-full">
      <h2 className="text-xl font-semibold mb-2 text-white">🎯 Paramètres RSSI</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white w-full sm:w-32"
          placeholder="RSSI Min"
        />
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white w-full sm:w-32"
          placeholder="RSSI Max"
        />
        <button
          onClick={onApply}
          className="w-full sm:w-auto bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}
