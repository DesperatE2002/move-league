// Lig Görüntüleme Sayfası
// Battle Ligi (ELO) ve Takım Ligi (Show) ayrı tab'larda

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

export default function LeagueView({ onBackClick }) {
  const [activeTab, setActiveTab] = useState('battle'); // 'battle' veya 'team'
  const [battleLeague, setBattleLeague] = useState(null);
  const [teamLeague, setTeamLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    setLoading(true);
    try {
      const [battleData, teamData] = await Promise.all([
        authApi.getBattleLeague(),
        authApi.getTeamLeague()
      ]);

      if (battleData.success) {
        setBattleLeague(battleData);
      }
      if (teamData.success) {
        setTeamLeague(teamData);
      }
    } catch (error) {
      console.error('Ligler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen p-6" style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
    }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={onBackClick}
          className="text-white/60 hover:text-white mb-4 flex items-center gap-2 transition-colors"
        >
          <span>←</span> Geri
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🏆 Move League Ligleri
            </h1>
            <p className="text-white/60">
              Battle ve Takım liglerinde sıralamaları görüntüle
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10">
          <button
            onClick={() => setActiveTab('battle')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'battle'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚔️ Battle Ligi (ELO)
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            👥 Takım Ligi (Show)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <p className="text-white/60 mt-4">Lig verileri yükleniyor...</p>
          </div>
        ) : activeTab === 'battle' ? (
          <BattleLeagueView data={battleLeague} formatDate={formatDate} />
        ) : (
          <TeamLeagueView data={teamLeague} formatDate={formatDate} />
        )}
      </div>
    </div>
  );
}

// Battle Ligi Görünümü
function BattleLeagueView({ data, formatDate }) {
  if (!data?.season) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
        <p className="text-white/60 text-lg">
          Şu anda aktif bir Battle Ligi sezonu bulunmuyor.
        </p>
      </div>
    );
  }

  const { season, rankings } = data;

  return (
    <div className="space-y-6">
      {/* Sezon Bilgisi */}
      <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-2xl p-6 border border-red-500/20 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{season.name}</h2>
            {season.description && (
              <p className="text-white/70 mb-4">{season.description}</p>
            )}
            <div className="flex gap-6 text-sm text-white/60">
              <div>
                <span className="block text-white/40">Başlangıç</span>
                <span className="text-white">{formatDate(season.startDate)}</span>
              </div>
              <div>
                <span className="block text-white/40">Bitiş</span>
                <span className="text-white">{formatDate(season.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Ödüller */}
          {season.prizeFirst && (
            <div className="flex gap-3">
              {season.prizeFirst && (
                <div className="text-center bg-yellow-500/20 px-4 py-3 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className="text-sm text-white/60">1.</div>
                  <div className="text-white font-bold">{season.prizeFirst}₺</div>
                </div>
              )}
              {season.prizeSecond && (
                <div className="text-center bg-gray-400/20 px-4 py-3 rounded-lg border border-gray-400/30">
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="text-sm text-white/60">2.</div>
                  <div className="text-white font-bold">{season.prizeSecond}₺</div>
                </div>
              )}
              {season.prizeThird && (
                <div className="text-center bg-orange-600/20 px-4 py-3 rounded-lg border border-orange-600/30">
                  <div className="text-2xl mb-1">🥉</div>
                  <div className="text-sm text-white/60">3.</div>
                  <div className="text-white font-bold">{season.prizeThird}₺</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sıralama Tablosu */}
      <div className="bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-white/60 font-semibold">Sıra</th>
              <th className="text-left p-4 text-white/60 font-semibold">Dansçı</th>
              <th className="text-left p-4 text-white/60 font-semibold">Stil</th>
              <th className="text-right p-4 text-white/60 font-semibold">ELO</th>
              <th className="text-right p-4 text-white/60 font-semibold">Maçlar</th>
              <th className="text-right p-4 text-white/60 font-semibold">G / M / B</th>
              <th className="text-right p-4 text-white/60 font-semibold">Kazanma %</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-white/40">
                  Henüz sıralama bulunmuyor
                </td>
              </tr>
            ) : (
              rankings.map((ranking) => (
                <tr 
                  key={ranking.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                      ranking.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                      ranking.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      ranking.rank === 3 ? 'bg-orange-600/20 text-orange-500' :
                      'bg-white/10 text-white/60'
                    }`}>
                      #{ranking.rank}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {ranking.dancerAvatar || ranking.dancerName.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{ranking.dancerName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-lg border border-purple-600/30">
                      {ranking.danceStyle}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-white font-bold text-lg">{ranking.rating}</span>
                  </td>
                  <td className="p-4 text-right text-white/80">
                    {ranking.totalBattles}
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-sm">
                      <span className="text-green-400">{ranking.wins}</span>
                      {' / '}
                      <span className="text-red-400">{ranking.losses}</span>
                      {' / '}
                      <span className="text-yellow-400">{ranking.draws}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-semibold ${
                      ranking.winRate >= 60 ? 'text-green-400' :
                      ranking.winRate >= 40 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {ranking.winRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Takım Ligi Görünümü
function TeamLeagueView({ data, formatDate }) {
  if (!data?.season) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
        <p className="text-white/60 text-lg">
          Şu anda aktif bir Takım Ligi sezonu bulunmuyor.
        </p>
      </div>
    );
  }

  const { season, teams, recentMatches, upcomingMatches } = data;

  return (
    <div className="space-y-6">
      {/* Sezon Bilgisi */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{season.name}</h2>
            {season.description && (
              <p className="text-white/70 mb-4">{season.description}</p>
            )}
            <div className="flex gap-6 text-sm text-white/60">
              <div>
                <span className="block text-white/40">Başlangıç</span>
                <span className="text-white">{formatDate(season.startDate)}</span>
              </div>
              <div>
                <span className="block text-white/40">Bitiş</span>
                <span className="text-white">{formatDate(season.endDate)}</span>
              </div>
              <div>
                <span className="block text-white/40">Takım Üyeleri</span>
                <span className="text-white">{season.minTeamMembers}-{season.maxTeamMembers} kişi</span>
              </div>
            </div>
          </div>

          {/* Ödüller */}
          {season.prizeFirst && (
            <div className="flex gap-3">
              {season.prizeFirst && (
                <div className="text-center bg-yellow-500/20 px-4 py-3 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className="text-sm text-white/60">1.</div>
                  <div className="text-white font-bold">{season.prizeFirst}₺</div>
                </div>
              )}
              {season.prizeSecond && (
                <div className="text-center bg-gray-400/20 px-4 py-3 rounded-lg border border-gray-400/30">
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="text-sm text-white/60">2.</div>
                  <div className="text-white font-bold">{season.prizeSecond}₺</div>
                </div>
              )}
              {season.prizeThird && (
                <div className="text-center bg-orange-600/20 px-4 py-3 rounded-lg border border-orange-600/30">
                  <div className="text-2xl mb-1">🥉</div>
                  <div className="text-sm text-white/60">3.</div>
                  <div className="text-white font-bold">{season.prizeThird}₺</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Takım Sıralaması */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Takım Sıralaması</h3>
          </div>
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 font-semibold">Sıra</th>
                <th className="text-left p-4 text-white/60 font-semibold">Takım</th>
                <th className="text-right p-4 text-white/60 font-semibold">Puan</th>
                <th className="text-right p-4 text-white/60 font-semibold">G / M / B</th>
                <th className="text-right p-4 text-white/60 font-semibold">Toplam Skor</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-white/40">
                    Henüz takım bulunmuyor
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr 
                    key={team.id}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold ${
                        team.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        team.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                        team.rank === 3 ? 'bg-orange-600/20 text-orange-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        #{team.rank || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {team.logo || team.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{team.name}</div>
                          <div className="text-sm text-white/40">{team.members.length} üye</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-white font-bold text-lg">{team.points}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm">
                        <span className="text-green-400">{team.wins}</span>
                        {' / '}
                        <span className="text-red-400">{team.losses}</span>
                        {' / '}
                        <span className="text-yellow-400">{team.draws}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-white/80 font-semibold">
                      {team.totalScore.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Maçlar */}
        <div className="space-y-4">
          {/* Yaklaşan Maçlar */}
          <div className="bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-lg font-bold text-white mb-4">📅 Yaklaşan Maçlar</h3>
            <div className="space-y-3">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/40 mb-2">
                      {formatDate(match.scheduledDate)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{match.homeTeam.name}</span>
                      <span className="text-white/40">vs</span>
                      <span className="text-white">{match.awayTeam.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">
                  Yaklaşan maç yok
                </p>
              )}
            </div>
          </div>

          {/* Son Sonuçlar */}
          <div className="bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-lg font-bold text-white mb-4">🏁 Son Sonuçlar</h3>
            <div className="space-y-3">
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/40 mb-2">
                      {formatDate(match.scheduledDate)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="text-white">{match.homeTeam.name}</div>
                        <div className="text-white font-bold">{match.homeScore}</div>
                      </div>
                      <div className="px-2 text-white/40">-</div>
                      <div className="flex-1 text-right">
                        <div className="text-white">{match.awayTeam.name}</div>
                        <div className="text-white font-bold">{match.awayScore}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">
                  Henüz tamamlanmış maç yok
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
