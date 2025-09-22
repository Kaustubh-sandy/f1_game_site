"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import ResultSection from './resultSection';
import Loader from './loader';

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

type PlayerAlias = { name: string; team: string };
type Player = { currentName: string; currentTeam: string; aliases: PlayerAlias[] };

type StandingEntry = { driver: string; team: string; points: number };
type TeamEntry = { team: string; points: number };
type WinEntry = { driver: string; team: string; wins: number };
type FastestCount = { driver: string; team: string; count: number };
type PositionGain = { race: number; driver: string; team: string; gained: number };
type FastestPerRace = { race: number; driver: string; team: string; lap_time: string };
type PodiumEntry = { driver: string; team: string; pos: number };

export default function Home() {
  const [numPlayersInput, setNumPlayersInput] = useState('1');
  const [players, setPlayers] = useState<Player[]>([{ currentName: '', currentTeam: '', aliases: [] }]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [csvFiles, setCsvFiles] = useState<FileList | null>(null);
  const [mostWins, setMostWins] = useState<WinEntry[]>([]);
  const [podiums, setPodiums] = useState<PodiumEntry[][]>([]);
  const [teamStandings, setTeamStandings] = useState<TeamEntry[]>([]);
  const [positionsGained, setPositionsGained] = useState<PositionGain[]>([]);
  const [fastestLapPerRace, setFastestLapPerRace] = useState<FastestPerRace[]>([]);
  const [mostFastestLaps, setMostFastestLaps] = useState<FastestCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumPlayersInput(value);
    if (value === '') return;
    const n = parseInt(value);
    if (!isNaN(n) && n >= 1) {
      setPlayers((prev) => {
        const arr = [...prev];
        while (arr.length < n) arr.push({ currentName: '', currentTeam: '', aliases: [] });
        while (arr.length > n) arr.pop();
        return arr;
      });
    }
  };

  const handleNumPlayersBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const n = parseInt(value);
    if (isNaN(n) || n < 1 || value === '') {
      setPlayers([{ currentName: '', currentTeam: '', aliases: [] }]);
      setNumPlayersInput('1');
    }
  };

  const handlePlayerChange = (idx: number, field: keyof Player, value: string) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
  };

  const handleAliasChange = (pIdx: number, aIdx: number, field: keyof PlayerAlias, value: string) => {
    setPlayers((prev) => {
      const arr = [...prev];
      const aliases = [...arr[pIdx].aliases];
      aliases[aIdx] = { ...aliases[aIdx], [field]: value };
      arr[pIdx] = { ...arr[pIdx], aliases };
      return arr;
    });
  };

  const addAlias = (pIdx: number) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[pIdx].aliases = [...arr[pIdx].aliases, { name: '', team: '' }];
      return arr;
    });
  };

  const removeAlias = (pIdx: number, aIdx: number) => {
    setPlayers((prev) => {
      const arr = [...prev];
      arr[pIdx].aliases = arr[pIdx].aliases.filter((_, i) => i !== aIdx);
      return arr;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFiles(e.target.files);
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const handleUpload = async () => {
    if (!csvFiles || csvFiles.length === 0) {
      alert('⚠️ Please upload CSV files first!');
      return;
    }

    const hasValidPlayers = players.some(player => player.currentName.trim() !== '' && player.currentTeam.trim() !== '');
    if (!hasValidPlayers) {
      alert('⚠️ Please fill in at least one player configuration (name and team) before calculating standings!');
      return;
    }

    const incompletePlayers = players.filter(player => player.currentName.trim() === '' || player.currentTeam.trim() === '');
    if (incompletePlayers.length > 0) {
      alert(`⚠️ Please complete the configuration for ${incompletePlayers.length} player(s) (name and team are required)!`);
      return;
    }

    const mapping = players.map((p) => ({ currentName: p.currentName, currentTeam: p.currentTeam, aliases: p.aliases.filter(a => a.name && a.team) }));

    const formData = new FormData();
    for (let i = 0; i < csvFiles.length; i++) formData.append('file', csvFiles[i]);
    formData.append('mapping', JSON.stringify(mapping));

    // Try endpoints: prefer API Gateway /dev base (ANY) if available
    const lambdaBase = 'https://6nb1io40l8.execute-api.ap-northeast-1.amazonaws.com/dev';
    const urls = [lambdaBase, `${lambdaBase}/upload`, 'http://192.168.137.1:5000/upload', 'http://localhost:5000/upload', 'https://f-backend-deploy.onrender.com/upload'];

    setIsLoading(true);
    try {
      let res: Response | undefined;
      let lastError: Error | null = null;
      for (const url of urls) {
        try {
          res = await fetch(url, { method: 'POST', body: formData });
          if (res && res.ok) break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (!res || !res.ok) throw lastError || new Error('Failed to connect to backend');

      const data = await res.json();
      setStandings(data.standings || []);
      setMostWins(data.most_wins || []);
      setPodiums(data.podiums || []);
      setTeamStandings(data.team_standings || []);
      setPositionsGained(data.positions_gained || []);
      setFastestLapPerRace(data.fastest_lap_per_race || []);
      setMostFastestLaps(data.most_fastest_laps || []);
    } catch (err) {
      console.error('Upload error', err);
      alert('❌ Upload failed. Check console and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-6xl relative z-20">
      {isLoading && <Loader />}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-red-600 to-white bg-clip-text text-transparent tracking-tight uppercase drop-shadow-lg">F1 Championship Tracker</h1>
  <p className="text-gray-200 text-lg font-medium">Track your friends&apos; F1 performance across multiple races</p>
      </div>

      {/* Player Configuration Card */}
      <div className="bg-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Player Configuration</h2>
          <div className="flex items-center space-x-3">
            <label className="font-medium text-gray-200">Number of Players:</label>
            <input type="number" min={1} value={numPlayersInput} onChange={handleNumPlayersChange} onBlur={handleNumPlayersBlur} className="w-20 px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white" />
          </div>
        </div>

        <div className="space-y-6">
          {players.map((player, pIdx) => (
            <div key={pIdx} className="bg-gradient-to-r bg-transparent to-red-900/10 rounded-xl p-6 border border-red-800 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">{pIdx + 1}</div>
                <h3 className="text-xl font-semibold text-white">Player {pIdx + 1}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Current Name</label>
                  <input type="text" value={player.currentName} onChange={e => handlePlayerChange(pIdx, 'currentName', e.target.value)} className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-black/50 text-white placeholder-gray-400" placeholder="Enter player name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Current Team</label>
                  <select value={player.currentTeam} onChange={e => handlePlayerChange(pIdx, 'currentTeam', e.target.value)} className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-black/50 text-white">
                    <option value="">Select Team</option>
                    {F1_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-200">Previous Names/Teams</label>
                  <button type="button" className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md" onClick={() => addAlias(pIdx)}>+ Add Previous</button>
                </div>

                <div className="space-y-3">
                  {player.aliases.map((alias, aIdx) => (
                    <div key={aIdx} className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg border border-gray-700">
                      <div className="flex-1">
                        <input type="text" value={alias.name} onChange={e => handleAliasChange(pIdx, aIdx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white placeholder-gray-400" placeholder="Previous name" />
                      </div>
                      <div className="flex-1">
                        <select value={alias.team} onChange={e => handleAliasChange(pIdx, aIdx, 'team', e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-black/50 text-white">
                          <option value="">Previous team</option>
                          {F1_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                        </select>
                      </div>
                      <button type="button" className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all duration-200" onClick={() => removeAlias(pIdx, aIdx)}>✕</button>
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
              <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer" onClick={triggerFileInput}>
                <div className="text-gray-300 mb-2">Click to select CSV files</div>
                <div className="text-xs text-gray-400">{csvFiles && csvFiles.length > 0 ? `${csvFiles.length} file(s) selected` : 'No files selected'}</div>
              </div>
              <input id="file-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" multiple />
            </div>
          </div>
          <div>
            <button type="button" className={`px-6 py-3 rounded-lg transition-all duration-200 shadow-md font-medium ${isLoading ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'}`} onClick={handleUpload} disabled={isLoading}>{isLoading ? 'Calculating…' : 'Calculate Standings'}</button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-black/70 rounded-xl p-6 border border-red-900 mt-8">
        <h3 className="text-lg font-semibold text-red-400 mb-2">📋 How to Use</h3>
        <p className="text-gray-200 mb-4">Enter your friends&apos; names and current teams. If anyone switched names or teams during the season, add their previous information. Upload all your CSV race files and get the combined championship standings.</p>

        <h4 className="text-md font-semibold text-white mt-3">Where to find exported CSV/Excel files</h4>
        <ol className="list-decimal list-inside text-gray-200 ml-4 mb-4">
          <li>Open Windows File Explorer.</li>
          <li>Navigate to <span className="font-mono">Documents</span> → <span className="font-mono">My Games</span> → <span className="font-mono">F1 24</span>.</li>
          <li>Open the <span className="font-mono">session results</span> folder to find race exports (CSV/Excel files).</li>
        </ol>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Example (folder path and screenshot):</p>
          <div className="flex gap-4">
            <div className="rounded-md border border-gray-700 overflow-hidden">
              <Image src="/assets/step1.png" alt="Documents → My Games" width={400} height={200} style={{ width: '400px', height: 'auto' }} />
            </div>
            <div className="rounded-md border border-gray-700 overflow-hidden">
              <Image src="/assets/step2.png" alt="F1 24 → session results" width={400} height={200} style={{ width: '400px', height: 'auto' }} />
            </div>
          </div>
        </div>

        <h4 className="text-md font-semibold text-white mt-3">Notes about player names and teams</h4>
        <ul className="list-disc list-inside text-gray-200 ml-4">
          <li>If a player exports race data only their name (teammate/friends info will come as player so enter player), their exported file will show only their name — the app will list that entry under the provided player name.</li>
          <li>If a driver changed name or team during the championship, add their previous names and previous teams in the <em>Previous Names/Teams</em> section so results are merged correctly under the current player configuration.</li>
          <li>When creating aliases, add both the previous name and the previous team (if available) to improve matching accuracy.</li>
        </ul>
      </div>

      {/* Results */}
      {(standings.length > 0 || teamStandings.length > 0) && (
        <div className="mt-8">
          <ResultSection standings={standings} teamStandings={teamStandings} mostWins={mostWins} mostFastestLaps={mostFastestLaps} positionsGained={positionsGained} fastestLapPerRace={fastestLapPerRace} podiums={podiums} />
        </div>
      )}

    </main>
  );
}
