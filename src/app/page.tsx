'use client';

import { useState } from 'react';

const F1_TEAMS = [
  "Red Bull",
  "Scuderia Ferrari HP",
  "McLaren",
  "Aston Martin",
  "Mercedes-AMG Petronas",
  "Alpine",
  "Haas",
  "KICK Sauber",
  "Visa Cash App RB",
  "Williams"
];

type PlayerAlias = {
  name: string;
  team: string;
};

type Player = {
  currentName: string;
  currentTeam: string;
  aliases: PlayerAlias[]; // old name/team pairs
};

export default function HomePage() {
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState<Player[]>([{ currentName: '', currentTeam: '', aliases: [] }]);
  const [standings, setStandings] = useState<any[]>([]);
  const [csvFiles, setCsvFiles] = useState<FileList | null>(null);
  const [mostWins, setMostWins] = useState<any[]>([]);
  const [podiums, setPodiums] = useState<any[]>([]);

  // Handle number of players change
  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Math.max(1, parseInt(e.target.value) || 1);
    setNumPlayers(n);
    setPlayers((prev) => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ currentName: '', currentTeam: '', aliases: [] });
      while (arr.length > n) arr.pop();
      return arr;
    });
  };

  // Handle player info change
  const handlePlayerChange = (idx: number, field: keyof Player, value: string) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
  };

  // Handle alias (old name/team) change
  const handleAliasChange = (pIdx: number, aIdx: number, field: keyof PlayerAlias, value: string) => {
    setPlayers((prev) => {
      const arr = [...prev];
      const aliases = [...arr[pIdx].aliases];
      aliases[aIdx] = { ...aliases[aIdx], [field]: value };
      arr[pIdx] = { ...arr[pIdx], aliases };
      return arr;
    });
  };

  // Add alias row
  const addAlias = (pIdx: number) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[pIdx].aliases = [...arr[pIdx].aliases, { name: '', team: '' }];
      return arr;
    });
  };

  // Remove alias row
  const removeAlias = (pIdx: number, aIdx: number) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[pIdx].aliases = arr[pIdx].aliases.filter((_, i) => i !== aIdx);
      return arr;
    });
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFiles(e.target.files);
  };

  // Upload and process
  const handleUpload = async () => {
    if (!csvFiles || csvFiles.length === 0) return;

    // Prepare mapping info for backend
    const mapping = players.map((p) => ({
      currentName: p.currentName,
      currentTeam: p.currentTeam,
      aliases: p.aliases.filter(a => a.name && a.team)
    }));

    const formData = new FormData();
    for (let i = 0; i < csvFiles.length; i++) {
      formData.append('file', csvFiles[i]);
    }
    formData.append('mapping', JSON.stringify(mapping));

    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setStandings(data.standings || []);
    setMostWins(data.most_wins || []);
    setPodiums(data.podiums || []);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">🏁 Upload F1 CSV Results (Multiple)</h1>

      <div className="mb-4">
        <label className="font-semibold">How many friends/players?</label>
        <input
          type="number"
          min={1}
          value={numPlayers}
          onChange={handleNumPlayersChange}
          className="ml-2 border px-2 py-1 w-16"
        />
      </div>

      {players.map((player, pIdx) => (
        <div key={pIdx} className="mb-4 border p-2 rounded">
          <div className="mb-2 font-semibold">Player {pIdx + 1}</div>
          <div className="mb-2">
            <label>Name: </label>
            <input
              type="text"
              value={player.currentName}
              onChange={e => handlePlayerChange(pIdx, 'currentName', e.target.value)}
              className="border px-2 py-1 mr-2"
            />
            <label>Team: </label>
            <select
            value={player.currentTeam}
            onChange={e => handlePlayerChange(pIdx, 'currentTeam', e.target.value)}
            className="border px-2 py-1"
            >
            <option value="" style={{ color: '#1d4ed8' }}>Select Team</option>
            {F1_TEAMS.map(team => (
            <option key={team} value={team} style={{ color: '#1d4ed8' }}>{team}</option>
            ))}
          </select>
          </div>
          <div>
            <label className="mr-2">Did this player switch name/team?</label>
            <button
              type="button"
              className="bg-blue-500 text-white px-2 py-1 rounded"
              onClick={() => addAlias(pIdx)}
            >
              Add Previous Name/Team
            </button>
          </div>
          {player.aliases.map((alias, aIdx) => (
            <div key={aIdx} className="flex items-center mt-2">
              <label>Old Name: </label>
              <input
                type="text"
                value={alias.name}
                onChange={e => handleAliasChange(pIdx, aIdx, 'name', e.target.value)}
                className="border px-2 py-1 mx-2"
              />
              <label>Old Team: </label>
              <select
  value={alias.team}
  onChange={e => handleAliasChange(pIdx, aIdx, 'team', e.target.value)}
  className="border px-2 py-1"
>
  <option value="" style={{ color: '#1d4ed8' }}>Select Team</option>
  {F1_TEAMS.map(team => (
    <option key={team} value={team} style={{ color: '#1d4ed8' }}>{team}</option>
  ))}
</select>
              <button
                type="button"
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => removeAlias(pIdx, aIdx)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ))}

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-2"
          multiple
        />
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-2 rounded ml-2"
          onClick={handleUpload}
        >
          Upload & Calculate Standings
        </button>
      </div>

      <h2 className="text-xl font-semibold mt-6">Final Standings</h2>
      {standings.length > 0 ? (
        <table className="mt-2 border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border px-2 py-1">Driver</th>
              <th className="border px-2 py-1">Team</th>
              <th className="border px-2 py-1">Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{row.driver}</td>
                <td className="border px-2 py-1">{row.team}</td>
                <td className="border px-2 py-1">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        
      ) : (
        <p className="mt-2 text-gray-500">No standings yet.</p>
      )}

      <h2 className="text-xl font-semibold mt-6">Most Wins</h2>
      {Array.isArray(mostWins) && mostWins.length > 0 ? (
        <ul className="mt-2">
          {mostWins.map((entry, i) => (
            <li key={i} className="mb-1">
              🏆 {entry.driver} ({entry.team}) - {entry.wins} win{entry.wins > 1 ? 's' : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-500">No wins data yet.</p>
      )}

      <h2 className="text-xl font-semibold mt-6">Podiums (Top 3 of Each Race)</h2>
      {Array.isArray(podiums) && podiums.length > 0 ? (
        <div className="mt-2">
          {podiums.map((race, idx) => (
            <div key={idx} className="mb-4">
              <div className="font-semibold">Race {idx + 1}</div>
              <ol className="list-decimal ml-6">
                {race.map((entry, i) => (
                  <li key={i}>
                    {entry.driver} ({entry.team}) - Pos {entry.pos}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-gray-500">No podiums data yet.</p>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Enter your friends names and teams. If anyone switched, add their old name/team. Upload all CSVs and get the combined standings!
      </p>
    </main>
  );
}