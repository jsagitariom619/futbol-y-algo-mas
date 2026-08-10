export function teamProfile(teamName, teams){
  const t=teams.find(x=>x.name===teamName);
  if(!t) return null;
  const s=t.stats||{};
  return {team:t, played:s.played||0, goalsFor:s.goalsFor??null, goalsAgainst:s.goalsAgainst??null,
    shots:s.shots??null, shotsOnTarget:s.shotsOnTarget??null, cornersFor:s.cornersFor??null,
    cornersAgainst:s.cornersAgainst??null, yellowCards:s.yellowCards??null, cleanSheets:s.cleanSheets??null,
    form:Array.isArray(t.form)?t.form:[]};
}
export function metric(value, suffix=""){
  return value===null || value===undefined ? "—" : `${value}${suffix}`;
}
export function combined(a,b,key){
  const x=a?.[key], y=b?.[key];
  if(typeof x!=="number" || typeof y!=="number") return null;
  return (x+y)/2;
}
export function analysisForMatch(home,away,teams){
  const h=teamProfile(home,teams), a=teamProfile(away,teams);
  return {home:h,away:a,combined:{goalsFor:combined(h,a,"goalsFor"),goalsAgainst:combined(h,a,"goalsAgainst"),cornersFor:combined(h,a,"cornersFor"),yellowCards:combined(h,a,"yellowCards")}};
}
