"use client";

import React from 'react';

type StandingEntry = { driver: string; team: string; points: number };
type TeamEntry = { team: string; points: number };
type WinEntry = { driver: string; team: string; wins: number };
type FastestCount = { driver: string; team: string; count: number };
type PositionGain = { race: number; driver: string; team: string; gained: number };
type FastestPerRace = { race: number; driver: string; team: string; lap_time: string };
type PodiumEntry = { driver: string; team: string; pos: number };

export default function ResultSection(props: {
  standings: StandingEntry[];
  teamStandings: TeamEntry[];
  mostWins: WinEntry[];
  mostFastestLaps: FastestCount[];
  positionsGained: PositionGain[];
  fastestLapPerRace: FastestPerRace[];
  podiums: PodiumEntry[][];
}) {
  const { standings, teamStandings, mostWins, mostFastestLaps, positionsGained, fastestLapPerRace, podiums } = props;

  if (!(standings.length > 0 || teamStandings.length > 0)) return null;

  return (
    <div className="space-y-8">
      {/* Standings Row */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Driver Standings */}
        <div className="flex-1 bg-transparent rounded-2xl shadow-xl p-6 border border-gray-200 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">🏆 Driver Standings</h2>
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
          <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center"> 🏎️ Team Standings</h2>
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
          <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">🏅 Most Wins</h2>
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
          <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">⚡ Most Fastest Laps (Season)</h2>
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
              <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">⬆️ Most Positions Gained (Per Race)</h2>
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
              <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">⚡ Fastest Lap (Per Race)</h2>
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

      {/* Podiums */}
      {Array.isArray(podiums) && podiums.length > 0 && (
        <div className="bg-transparent rounded-2xl shadow-xl p-6 mt-8 border border-gray-200 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white/95 mb-4 flex items-center">🏁 Race Podiums</h2>
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
    </div>
  );
}