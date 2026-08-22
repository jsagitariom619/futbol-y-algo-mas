// IDs estables de las competiciones principales en API-Football.
export const leagueMap = {
  "premier-league": 39,
  "bundesliga": 78,
  "laliga": 140,
  "ligue-1": 61,
  "serie-a": 135,
  "primeira-liga": 94,
  "champions-league": 2
};

export function apiSeason(season){
  const m=String(season||'').match(/^(\d{4})/);
  return m ? Number(m[1]) : new Date().getUTCFullYear();
}
