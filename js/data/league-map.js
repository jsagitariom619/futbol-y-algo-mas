// IDs estables de competiciones en API-Football. La cobertura real se comprueba por temporada.
export const leagueMap = {
  'premier-league':39,
  'championship':40,
  'laliga':140,
  'laliga-hypermotion':141,
  'bundesliga':78,
  'bundesliga-2':79,
  'serie-a':135,
  'serie-b':136,
  'ligue-1':61,
  'ligue-2':62,
  'eredivisie':88,
  'primeira-liga':94,
  'belgian-pro-league':144,
  'scottish-premiership':179,
  'super-lig':203,
  'brasileirao':71,
  'liga-argentina':128,
  'liga-mx':262,
  'mls':253,
  'saudi-pro-league':307,
  'champions-league':2,
  'europa-league':3,
  'conference-league':848
};

export function apiSeason(season){
  const m=String(season||'').match(/^(\d{4})/);
  return m ? Number(m[1]) : new Date().getUTCFullYear();
}
