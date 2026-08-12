const cacheKey = (action, params) => `fa-history:${action}:${JSON.stringify(params)}`;

async function call(action, params = {}, ttl = 900) {
  const key = cacheKey(action, params);
  const now = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && now - saved.time < ttl * 1000) return saved.data;
  } catch {}

  const qs = new URLSearchParams({ action, ...params });
  const response = await fetch(`/api/historical?${qs.toString()}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error || payload?.upstream?.message || 'Fuente histórica no disponible.');
  }
  try { localStorage.setItem(key, JSON.stringify({ time: now, data: payload.data })); } catch {}
  return payload.data;
}

export const historicalCompetitions = ['PL','ELC','BL1','BL2','PD','FL1','SA','PPL'];
export const historicalSeasons = [
  ['2025','2025/26'],
  ['2024','2024/25'],
  ['2023','2023/24']
];

export const getHistoricalMatches = (competition, season) =>
  call('matches', { competition, season, status:'FINISHED' }, 1800);
export const getHistoricalTeams = (competition, season) =>
  call('teams', { competition, season }, 21600);
export const getHistoricalTeamMatches = (teamId, season) =>
  call('teamMatches', { teamId, season, status:'FINISHED' }, 1800);
export const getHistoricalMatch = matchId => call('match', { matchId }, 21600);
