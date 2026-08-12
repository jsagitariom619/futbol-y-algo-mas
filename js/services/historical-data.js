const cacheKey=(action,params)=>`historical-data:${action}:${JSON.stringify(params)}`;

async function call(action,params={},ttl=900){
  const key=cacheKey(action,params), now=Date.now();
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&now-saved.time<ttl*1000)return saved.data;}catch{}
  const qs=new URLSearchParams({action,...params});
  const r=await fetch(`/api/historical?${qs.toString()}`);
  const payload=await r.json().catch(()=>({}));
  if(!r.ok||!payload.ok)throw new Error(payload?.error||payload?.upstream?.message||'Fuente histórica no disponible.');
  try{localStorage.setItem(key,JSON.stringify({time:now,data:payload.data}));}catch{}
  return payload.data;
}

export async function getHistoricalTeams(competition,season){
  const data=await call('teams',{competition,season},21600);
  return data?.teams||[];
}

export async function getHistoricalMatches(competition,season,extra={}){
  const data=await call('matches',{competition,season,status:'FINISHED',...extra},900);
  return data?.matches||[];
}

export async function getHistoricalTeamMatches(teamId,season,extra={}){
  const data=await call('teamMatches',{teamId,season,status:'FINISHED',...extra},900);
  return data?.matches||[];
}

export async function getHistoricalMatch(matchId){
  const data=await call('match',{matchId},21600);
  return data || null;
}

export function normalizeName(value=''){
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}

export function findHistoricalTeam(teams,name){
  const target=normalizeName(name);
  return teams.find(t=>normalizeName(t?.name)===target)
    ||teams.find(t=>normalizeName(t?.shortName)===target)
    ||teams.find(t=>normalizeName(t?.name).includes(target)||target.includes(normalizeName(t?.name)))
    ||null;
}
