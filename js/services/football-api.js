import {leagueMap,apiSeason} from '../data/league-map.js';

const cacheKey=(action,params)=>`fa-api:${action}:${JSON.stringify(params)}`;
async function call(action,params={},ttl=300){
  const key=cacheKey(action,params), now=Date.now();
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&now-saved.time<ttl*1000)return saved.data;}catch{}
  const qs=new URLSearchParams({action,...params});
  const r=await fetch(`/api/football?${qs.toString()}`);
  const payload=await r.json();
  if(!r.ok||!payload.ok)throw new Error(payload?.error||'Fuente estadística no disponible.');
  try{localStorage.setItem(key,JSON.stringify({time:now,data:payload.data}));}catch{}
  return payload.data;
}
export async function getLeagueFixtures(competition,season){const league=leagueMap[competition];if(!league)throw new Error('Competición no configurada.');return call('fixtures',{league,season:apiSeason(season)},900);}
export async function getStandings(competition,season){const league=leagueMap[competition];if(!league)throw new Error('Competición no configurada.');return call('standings',{league,season:apiSeason(season)},900);}
export async function getTeamStats(team,competition,season){const league=leagueMap[competition];if(!league)throw new Error('Competición no configurada.');return call('teamStats',{league,season:apiSeason(season),team},21600);}
export async function getFixtureStats(fixture){return call('fixtureStats',{fixture},3600);}
export async function getTeamMatches(team,competition,season,last=10){const league=leagueMap[competition];if(!league)throw new Error('Competición no configurada.');return call('teamMatches',{team,league,season:apiSeason(season),last},3600);}
export async function getHeadToHead(homeId,awayId,last=5){return call('headToHead',{h2h:`${homeId}-${awayId}`,last},21600);}
