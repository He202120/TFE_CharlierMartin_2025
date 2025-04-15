// src/App.jsx
import React, { useState } from 'react';
import { sendMessage } from './services/mqtt';

function App() {
  const [pilots, setPilots] = useState([]);
  const [newPilot, setNewPilot] = useState('');
  const [racePilots, setRacePilots] = useState({});

  const handleAddPilot = () => {
    if (newPilot.trim() !== '') {
      setPilots([...pilots, newPilot.trim()]);
      setNewPilot('');
    }
  };

  const handleSelectPilot = (pilot) => {
    setRacePilots({
      ...racePilots,
      [pilot]: racePilots[pilot]
        ? undefined
        : { frequency: '', color: '#000000' },
    });
  };

  const handlePilotChange = (pilot, field, value) => {
    setRacePilots({
      ...racePilots,
      [pilot]: {
        ...racePilots[pilot],
        [field]: value,
      },
    });
  };

  const handleStartRace = () => {
    const selectedPilots = Object.entries(racePilots)
      .filter(([_, data]) => data !== undefined)
      .map(([name, data]) => ({
        name,
        ...data,
      }));

    const message = {
      race: {
        pilots: selectedPilots,
        timestamp: Date.now(),
      },
    };

    sendMessage('race/start', JSON.stringify(message));
    console.log('Course envoyée :', message);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Organisation de Course</h1>

      {/* Ajouter un pilote */}
      <div>
        <input
          type="text"
          value={newPilot}
          placeholder="Nom du pilote"
          onChange={(e) => setNewPilot(e.target.value)}
        />
        <button onClick={handleAddPilot}>Ajouter pilote</button>
      </div>

      {/* Liste des pilotes */}
      <h2>Pilotes</h2>
      {pilots.length === 0 && <p>Aucun pilote pour le moment.</p>}
      <ul>
        {pilots.map((pilot, idx) => (
          <li key={idx}>
            <label>
              <input
                type="checkbox"
                checked={racePilots[pilot] !== undefined}
                onChange={() => handleSelectPilot(pilot)}
              />
              {pilot}
            </label>

            {racePilots[pilot] && (
              <div style={{ marginLeft: '1rem' }}>
                <label>
                  Fréquence :{' '}
                  <input
                    type="text"
                    value={racePilots[pilot].frequency}
                    onChange={(e) =>
                      handlePilotChange(pilot, 'frequency', e.target.value)
                    }
                  />
                </label>{' '}
                <label>
                  Couleur :{' '}
                  <input
                    type="color"
                    value={racePilots[pilot].color}
                    onChange={(e) =>
                      handlePilotChange(pilot, 'color', e.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Lancer la course */}
      <button
        onClick={handleStartRace}
        disabled={
          Object.values(racePilots).filter((v) => v !== undefined).length === 0
        }
        style={{ marginTop: '1rem' }}
      >
        Lancer la course
      </button>
    </div>
  );
}

export default App;
