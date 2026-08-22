let dbPromise=null;
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
export async function loadHistoricalDB(){
  if(!dbPromise) dbPromise=fetch('/data/historical-db.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Base histórica precargada no disponible.');return r.json();});
  return dbPromise;
}
const compAliases={
  'premier-league':'premier-league','laliga':'laliga','serie-a':'serie-a','bundesliga':'bundesliga','ligue-1':'ligue-1','primeira-liga':'primeira-liga','champions-league':'champions-league'
};
export async function getLeagueTeams(leagueId){
  const db=await loadHistoricalDB();
  const id=compAliases[leagueId]||leagueId;
  const latest=(db.seasons||[]).slice().sort().reverse();
  for(const season of latest){
    const teams=[...new Set((db.matches||[]).filter(m=>m.competition===id&&m.season===season).flatMap(m=>[m.home,m.away]))].sort((a,b)=>a.localeCompare(b));
    if(teams.length)return teams;
  }
  return [...new Set((db.matches||[]).filter(m=>m.competition===id).flatMap(m=>[m.home,m.away]))].sort((a,b)=>a.localeCompare(b));
}
function isTeam(m,name){const n=norm(name),h=norm(m.home),a=norm(m.away);return h===n||a===n||h.includes(n)||a.includes(n)||n.includes(h)||n.includes(a);}
function teamSide(m,name){const n=norm(name),h=norm(m.home);return h===n||h.includes(n)||n.includes(h)?'home':'away';}
function summarizeRows(rows,name,limit=10){
  const xs=rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,limit);let gf=0,ga=0,w=0,d=0,l=0,total=0,btts=0,corners=0,cornersN=0,yellow=0,yellowN=0,red=0,redN=0,offsides=0,offsidesN=0;
  for(const m of xs){const side=teamSide(m,name);const f=Number(side==='home'?m.homeGoals:m.awayGoals)||0;const a=Number(side==='home'?m.awayGoals:m.homeGoals)||0;gf+=f;ga+=a;total+=f+a;if(f>0&&a>0)btts++;if(f>a)w++;else if(f===a)d++;else l++;
    const stats=m.stats||{};if(Number.isFinite(Number(stats.corners))){corners+=Number(stats.corners);cornersN++;}if(Number.isFinite(Number(stats.yellow))){yellow+=Number(stats.yellow);yellowN++;}if(Number.isFinite(Number(stats.red))){red+=Number(stats.red);redN++;}if(Number.isFinite(Number(stats.offsides))){offsides+=Number(stats.offsides);offsidesN++;}}
  const n=xs.length||1;return {sample:xs.length,gf:gf/n,ga:ga/n,total:total/n,w,d,l,btts:btts/n,corners:cornersN?corners/cornersN:null,yellow:yellowN?yellow/yellowN:null,red:redN?red/redN:null,offsides:offsidesN?offsides/offsidesN:null,form:xs.map(m=>{const s=teamSide(m,name),f=Number(s==='home'?m.homeGoals:m.awayGoals)||0,a=Number(s==='home'?m.awayGoals:m.homeGoals)||0;return f>a?'G':f===a?'E':'P';})};
}
export async function analyzeHistoricalTeams(homeName,awayName,{homeLeague='',awayLeague='',limit=10}={}){
  const db=await loadHistoricalDB();const all=db.matches||[];
  const homeRows=all.filter(m=>isTeam(m,homeName)&&(!homeLeague||m.competition===homeLeague));
  const awayRows=all.filter(m=>isTeam(m,awayName)&&(!awayLeague||m.competition===awayLeague));
  const h=summarizeRows(homeRows,homeName,limit),a=summarizeRows(awayRows,awayName,limit);
  const h2hRows=all.filter(m=>isTeam(m,homeName)&&isTeam(m,awayName)).sort((x,y)=>String(y.date).localeCompare(String(x.date))).slice(0,limit);
  let hw=0,d=0,aw=0,h2hGoals=0;for(const m of h2hRows){const hs=teamSide(m,homeName),hg=Number(hs==='home'?m.homeGoals:m.awayGoals)||0,ag=Number(hs==='home'?m.awayGoals:m.homeGoals)||0;h2hGoals+=hg+ag;if(hg>ag)hw++;else if(hg===ag)d++;else aw++;}
  const expectedHome=(h.gf+a.ga)/2,expectedAway=(a.gf+h.ga)/2;
  return {home:h,away:a,homeName,awayName,expectedHome,expectedAway,totalGoals:expectedHome+expectedAway,h2h:{sample:h2hRows.length,homeWins:hw,draws:d,awayWins:aw,goals:h2hRows.length?h2hGoals/h2hRows.length:null},generatedAt:db.generatedAt||''};
}
