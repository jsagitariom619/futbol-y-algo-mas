// IDs estables de competiciones en API-Football. Solo las ocho competiciones seleccionadas.
export const leagueMap = {
  "premier-league": 39,
  "championship": 40,
  "bundesliga": 78,
  "bundesliga-2": 79,
  "laliga": 140,
  "ligue-1": 61,
  "serie-a": 135,
  "primeira-liga": 94
};

export function apiSeason(season){
  const m=String(season||'').match(/^(\d{4})/);
  return m ? Number(m[1]) : new Date().getUTCFullYear();
}
