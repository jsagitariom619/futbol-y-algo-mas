const cacheKey=(action,params)=>`fa-history:${action}:${JSON.stringify(params)}`;
async function call(action,params={},ttl=900){
  const key=cacheKey(action,params), now=Date.now();
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&now-saved.time<ttl*1000)return saved.data;}catch{}
  const qs=new URLSearchParams({action,...params});
  const r=await fetch(`/api/historical?${qs.toString()}`);
  const payload=await r.json();
  if(!r.ok||!payload.ok) throw new Error(payload?.error||payload?.upstream?.message||'Fuente histórica no disponible.');
  try{localStorage.setItem(key,JSON.stringify({time:now,data:payload.data}));}catch{}
  return payload.data;
}
export const historicalCompetitions=['PL','ELC','BL1','BL2','PD','FL1','SA','PPL'];
export function getHistoricalMatches(competition,season,extra={}){return call('matches',{competition,season,status:'FINISHED',...extra},1800);}
export function getHistoricalTeams(competition,season){return call('teams',{competition,season},21600);}
export function getHistoricalTeamMatches(teamId,season,extra={}){return call('teamMatches',{teamId,season,status:'FINISHED',...extra},1800);}
export function getHistoricalMatch(matchId){return call('match',{matchId},21600);}
export function getHistoricalCompetition(code,season){return call('competition',{competition:code,season},21600);}
