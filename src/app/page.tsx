'use client';

import { useState } from 'react';
import Image from 'next/image';

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

type StandingEntry = {
  driver: string;
  team: string;
  points: number;
};

type WinEntry = {
  driver: string;
  team: string;
  wins: number;
};

type PodiumEntry = {
  driver: string;
  team: string;
  pos: number;
};

export default function HomePage() {
  const [numPlayers, setNumPlayers] = useState(1);
  const [numPlayersInput, setNumPlayersInput] = useState('1');
  const [players, setPlayers] = useState<Player[]>([{ currentName: '', currentTeam: '', aliases: [] }]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [csvFiles, setCsvFiles] = useState<FileList | null>(null);
  const [mostWins, setMostWins] = useState<WinEntry[]>([]);
  const [podiums, setPodiums] = useState<PodiumEntry[][]>([]);
  const [teamStandings, setTeamStandings] = useState<{ team: string; points: number }[]>([]);
  const [positionsGained, setPositionsGained] = useState<{ race: number; driver: string; team: string; gained: number }[]>([]);
  const [fastestLapPerRace, setFastestLapPerRace] = useState<{ race: number; driver: string; team: string; lap_time: string }[]>([]);
  const [mostFastestLaps, setMostFastestLaps] = useState<{ driver: string; team: string; count: number }[]>([]);

  // Handle number of players change
  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumPlayersInput(value); // Always update the input value
    
    // Allow empty input for better UX
    if (value === '') {
      return;
    }
    
    const n = parseInt(value);
    
    // Only update players if it's a valid number
    if (!isNaN(n) && n >= 1) {
      setNumPlayers(n);
      setPlayers((prev) => {
        const arr = [...prev];
        while (arr.length < n) arr.push({ currentName: '', currentTeam: '', aliases: [] });
        while (arr.length > n) arr.pop();
        return arr;
      });
    }
  };

  // Handle blur to ensure valid value
  const handleNumPlayersBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const n = parseInt(value);
    
    // If invalid or empty, set to minimum
    if (isNaN(n) || n < 1 || value === '') {
      setNumPlayers(1);
      setNumPlayersInput('1');
    }
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
    console.log('File input changed:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      console.log('Files selected:', e.target.files.length);
      for (let i = 0; i < e.target.files.length; i++) {
        console.log('File', i, ':', e.target.files[i].name, e.target.files[i].size, 'bytes');
      }
    } else {
      console.log("No file selected or input cancelled");
    }
    setCsvFiles(e.target.files);
  };

  // Manual trigger for mobile devices
  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Upload and process
  const handleUpload = async () => {
    console.log('Upload button clicked');
    console.log('CSV files state:', csvFiles);
    
    // Validate if files are uploaded
    if (!csvFiles || csvFiles.length === 0) {
      alert('⚠️ Please upload CSV files first!');
      return;
    }

    // Validate if player configuration is filled
    const hasValidPlayers = players.some(player => 
      player.currentName.trim() !== '' && player.currentTeam.trim() !== ''
    );

    if (!hasValidPlayers) {
      alert('⚠️ Please fill in at least one player configuration (name and team) before calculating standings!');
      return;
    }

    // Check if all players have names and teams
    const incompletePlayers = players.filter(player => 
      player.currentName.trim() === '' || player.currentTeam.trim() === ''
    );

    if (incompletePlayers.length > 0) {
      const incompleteCount = incompletePlayers.length;
      alert(`⚠️ Please complete the configuration for ${incompleteCount} player${incompleteCount > 1 ? 's' : ''} (name and team are required)!`);
      return;
    }

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

    try {
      // Detect if we're on HTTPS or localhost for proper URL selection
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      
      // Try the network IP first, fallback to localhost
      const urls = isLocalhost ? [
        'http://localhost:5000/upload',
        'http://192.168.137.1:5000/upload',
        'https://f1-champ-tracker.vercel.app/upload'
      ] : [
        'http://192.168.137.1:5000/upload',
        'http://localhost:5000/upload',
        'https://f1-champ-tracker.vercel.app/upload'
      ];
      
      console.log('Environment detected:', { isLocalhost, isHttps, hostname: window.location.hostname });
      
      let res;
      let lastError;
      
      for (const url of urls) {
        try {
          console.log('Attempting to fetch from:', url);
          res = await fetch(url, {
            method: 'POST',
            body: formData,
          });
          
          if (res.ok) {
            console.log('Successfully connected to:', url);
            break;
          }
        } catch (err) {
          console.log('Failed to connect to:', url, err);
          lastError = err;
        }
      }
      
      if (!res || !res.ok) {
        throw lastError || new Error('Failed to connect to backend server');
      }

      const data = await res.json();
      console.log('Response received:', data);
      
      setStandings(data.standings || []);
      setMostWins(data.most_wins || []);
      setPodiums(data.podiums || []);
      setTeamStandings(data.team_standings || []);
      setPositionsGained(data.positions_gained || []);
      setFastestLapPerRace(data.fastest_lap_per_race || []);
      setMostFastestLaps(data.most_fastest_laps || []);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Upload failed: ${errorMessage}. Please check your connection and try again.`);
    }
  };

  return (
    <div className="min-h-screen w-full relative font-sans" >
                      {/* Background image with dark overlay */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/assets/F6e6EaIWMAEhbam.jpg"
            alt="F1 Background"
            fill
            className="object-cover object-center"
            //style={{ filter: 'brightness(0.4) grayscale(0.2)' }}
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/20 to-red-900/40" />
        </div>

        <main className="container mx-auto p-8 max-w-6xl relative z-20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-red-600 to-white bg-clip-text text-transparent tracking-tight uppercase drop-shadow-lg">
              🏁 F1 Championship Tracker
            </h1>
            <p className="text-gray-200 text-lg font-medium">Track your friends&apos; F1 performance across multiple races</p>
          </div>
          {/* Player Configuration Card */}
          <div className="bg-transparent">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Player Configuration</h2>
              <div className="flex items-center space-x-3">
                <label className="font-medium text-gray-200">Number of Players:</label>
                <input
                  type="number"
                  min={1}
                  value={numPlayersInput}
                  onChange={handleNumPlayersChange}
                  onBlur={handleNumPlayersBlur}
                  className="w-20 px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white"
                />
              </div>
            </div>

            <div className="space-y-6">
              {players.map((player, pIdx) => (
                <div key={pIdx} className="bg-gradient-to-r bg-transparent to-red-900/10 rounded-xl p-6 border border-red-800 backdrop-blur-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {pIdx + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">Player {pIdx + 1}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Current Name</label>
                      <input
                        type="text"
                        value={player.currentName}
                        onChange={e => handlePlayerChange(pIdx, 'currentName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-black/50 text-white placeholder-gray-400"
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Current Team</label>
                      <select
                        value={player.currentTeam}
                        onChange={e => handlePlayerChange(pIdx, 'currentTeam', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-black/50 text-white"
                      >
                        <option value="">Select Team</option>
                        {F1_TEAMS.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-200">Previous Names/Teams</label>
                      <button
                        type="button"
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md"
                        onClick={() => addAlias(pIdx)}
                      >
                        + Add Previous
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {player.aliases.map((alias, aIdx) => (
                        <div key={aIdx} className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg border border-gray-700">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={alias.name}
                              onChange={e => handleAliasChange(pIdx, aIdx, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white placeholder-gray-400"
                              placeholder="Previous name"
                            />
                          </div>
                          <div className="flex-1">
                            <select
                              value={alias.team}
                              onChange={e => handleAliasChange(pIdx, aIdx, 'team', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white"
                            >
                              <option value="">Previous team</option>
                              {F1_TEAMS.map(team => (
                                <option key={team} value={team}>{team}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all duration-200"
                            onClick={() => removeAlias(pIdx, aIdx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload Card */}
          <div className="bg-transparent rounded-2xl shadow-xl p-6 mt-8 mb-8 border border-red-900 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Race Data</h2>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 w-full">
                <div className="w-full">
                  <div 
                    className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <div className="text-gray-300 mb-2">
                      📁 Click to select CSV files
                    </div>
                    <div className="text-xs text-gray-400">
                      {csvFiles && csvFiles.length > 0 
                        ? `${csvFiles.length} file(s) selected` 
                        : 'No files selected'
                      }
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </div>
              </div>
              <button
                type="button"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md font-medium"
                onClick={handleUpload}
              >
                🚀 Calculate Standings
              </button>
            </div>
          </div>

        {/* Results Section */}
        {(standings.length > 0 || teamStandings.length > 0) && (
          <div className="space-y-8">
            {/* Standings Row */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Driver Standings */}
              <div className="flex-1 bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                  🏆 Driver Standings
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-50 to-red-100">
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Position</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Driver</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-200 px-4 py-3 font-medium text-white/95">{i + 1}</td>
                          <td className="border-b border-gray-200 px-4 py-3 font-medium text-white/95">{row.driver}</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-white/95">{row.team}</td>
                          <td className="border-b border-gray-200 px-4 py-3 font-bold text-yellow-400">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Team Standings */}
              <div className="flex-1 bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                  🏢 Team Standings
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-50 to-red-100">
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Position</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Team</th>
                        <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStandings.map((row, i) => (
                        <tr key={i}>
                          <td className="border-b border-gray-200 px-4 py-3 font-medium text-white/95">{i + 1}</td>
                          <td className="border-b border-gray-200 px-4 py-3 font-medium text-white/95">{row.team}</td>
                          <td className="border-b border-gray-200 px-4 py-3 font-bold text-yellow-400">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Most Wins */}
            {Array.isArray(mostWins) && mostWins.length > 0 && (
              <div className="bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                  🏅 Most Wins
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mostWins.map((entry, i) => (
                    <div key={i} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{entry.driver}</div>
                          <div className="text-sm text-gray-600">{entry.team}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-600">{entry.wins}</div>
                          <div className="text-xs text-gray-500">win{entry.wins > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Most Fastest Laps (season summary) */}
            {Array.isArray(mostFastestLaps) && mostFastestLaps.length > 0 && (
              <div className="bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                  ⚡ Most Fastest Laps (Season)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mostFastestLaps.map((entry, i) => (
                    <div key={i} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{entry.driver}</div>
                          <div className="text-sm text-gray-600">{entry.team}</div>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{entry.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Most Positions Gained & Fastest Lap per race */}
            {(Array.isArray(positionsGained) && positionsGained.length > 0) || (Array.isArray(fastestLapPerRace) && fastestLapPerRace.length > 0) ? (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Most Positions Gained */}
                {Array.isArray(positionsGained) && positionsGained.length > 0 && (
                  <div className="flex-1 bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                      ⬆️ Most Positions Gained (Per Race)
                    </h2>
                    <div className="space-y-3">
                      {positionsGained.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                          <div>
                            <div className="font-semibold text-gray-800">Race {entry.race}: {entry.driver}</div>
                            <div className="text-sm text-gray-600">{entry.team}</div>
                          </div>
                          <div className="text-green-600 font-bold">+{entry.gained}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Fastest Lap Per Race */}
                {Array.isArray(fastestLapPerRace) && fastestLapPerRace.length > 0 && (
                  <div className="flex-1 bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                      ⚡ Fastest Lap (Per Race)
                    </h2>
                    <div className="space-y-3">
                      {fastestLapPerRace.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                          <div className="font-semibold text-gray-800">Race {entry.race}: {entry.driver} <span className="text-xs text-gray-600 ml-2">({entry.team})</span></div>
                          <div className="text-purple-600 font-bold">{entry.lap_time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
            {/* Podiums */}
            {Array.isArray(podiums) && podiums.length > 0 && (
              <div className="bg-transparent rounded-2xl shadow-xl p-6 mt-8 border border-gray-200 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">
                  🏁 Race Podiums
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {podiums.map((race, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-3">Race {idx + 1}</h3>
                      <div className="space-y-2">
                        {race.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white/80 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                i === 0 ? 'bg-yellow-500 text-white' :
                                i === 1 ? 'bg-gray-400 text-white' :
                                'bg-orange-500 text-white'
                              }`}>
                                {i + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{entry.driver}</div>
                                <div className="text-xs text-gray-600">{entry.team}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-600">P{entry.pos}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
        {/* Instructions */}
        <div className="bg-black/70 rounded-xl p-6 border border-red-900 mt-8">
          <h3 className="text-lg font-semibold text-red-400 mb-2">📋 How to Use</h3>
          <p className="text-gray-200">
            Enter your friends&apos; names and current teams. If anyone switched names or teams during the season, 
            add their previous information. Upload all your CSV race files and get the combined championship standings!
          </p>
        </div>
      </main>
    </div>
  );
}