import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 flex items-center gap-2">
        <img src="/camera-drone.png" alt="Logo" className="w-8 h-8" />
        <h1 className="text-2xl font-bold text-white">Drone RSSI Monitor</h1>
      </header>
      <Dashboard />
    </div>
  );
}

export default App;
