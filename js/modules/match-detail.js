import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {getTeamStats,getTeamMatches,getFixtureStats} from "../services/football-api.js";
import {summarizeTeamFixtures,fixtureStatMap} from "../services/statistics.js";

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fmt=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'Fecha no disponible':x.toLocaleString('es-BO',{dateStyle:'full',timeStyle:'short'});};
const val=v=>v===null||v===undefined||v===''?'Sin datos':v;
const pctText=(x,sample)=>x==null?'Sin datos':`${x}% histórico · muestra ${sample}`;
const row=(label,h,a)=>`<div class="stat-row"><span>${label}</span><b>${val(h)}</b><i>vs</i><b>${val(a)}</b></div>`;
const teamByName=name=>teams.find(t=>t.name===name);

function localBaseline(teamName){
 const t=teamByName(teamName); return t?.stats?.played ? {
  sample:t.stats.played,
  avgFor:t.stats.goalsFor!=null&&t.stats.played?Math.round(t.stats.goalsFor/t.stats.played*100)/100:null,
  avgAgainst:t.stats.goalsAgainst!=null&&t.stats.played?Math.round(t.stats.goalsAgainst/t.stats.played*100)/100:null,
  avgTotal:null,over1:null,over2:null,cleanSheets:null
 } : {sample:0};
}

async function loadTeam(name,competition,season){
 const local=localBaseline(name);
 const apiId=teamByName(name)?.apiId;
 if(!apiId) return {name,profile:null,history:local,fixtures:null,source:'Fuente no configurada'};
 try{
  const [profile,fixtures]=await Promise.all([
   getTeamStats(apiId,competition,season),
   getTeamMatches(apiId,season,10)
  ]);
  return {name,profile:profile?.response||{},history:summarizeTeamFixtures(fixtures,apiId),fixtures,source:'API estadística'};
 }catch(e){return {name,profile:null,history:local,fixtures:null,source:'Sincronización pendiente',error:e.message};}
}

export async function matchDetail(id){
 const m=matches.find(x=>x.id===id); if(!m)return `<div class="empty">Partido no encontrado.</div>`;
 const c=competitions.find(x=>x.id===m.competitionId);
 const season=m.season || c?.season || '2026/27';
 const [home,away]=await Promise.all([loadTeam(m.home,m.competitionId,season),loadTeam(m.away,m.competitionId,season)]);
 let fixtureStats=[];
 if(m.apiFixtureId){try{fixtureStats=fixtureStatMap(await getFixtureStats(m.apiFixtureId));}catch{fixtureStats=[];}}
 const h=home.history||{}, a=away.history||{};
 const fsH=fixtureStats.find(x=>x.teamId===teamByName(m.home)?.apiId)||fixtureStats[0]||{};
 const fsA=fixtureStats.find(x=>x.teamId===teamByName(m.away)?.apiId)||fixtureStats[1]||{};
 const source=[home.source,away.source].filter(Boolean).join(' · ') || 'Fuente no disponible';
 return `<div class="back-link" data-back="matches">← Volver a fixtures</div>
 <div class="match-hero card"><span class="badge live">${esc(c?.name||m.competitionId)}</span><div class="match-title"><h2>${esc(m.home)}</h2><div class="vs-big">VS</div><h2>${esc(m.away)}</h2></div><p class="muted">${fmt(m.date)} · ${esc(m.round||'')}</p></div>
 <div class="section-title"><div><h2>Análisis estadístico</h2><p class="muted">Datos históricos y estadísticas verificables. La muestra y la fuente acompañan cada cálculo.</p></div></div>
 <div class="analysis-grid">
  <div class="card"><h3>⚽ Goles</h3>${row('Promedio a favor',h.avgFor,a.avgFor)}${row('Promedio recibido',h.avgAgainst,a.avgAgainst)}${row('Promedio total observado',h.avgTotal,a.avgTotal)}${row('2+ goles · frecuencia histórica',pctText(h.over1,h.sample),pctText(a.over1,a.sample))}${row('3+ goles · frecuencia histórica',pctText(h.over2,h.sample),pctText(a.over2,a.sample))}</div>
  <div class="card"><h3>🚩 Córners y fuera de juego</h3>${row('Córners',fsH['Corner Kicks'],fsA['Corner Kicks'])}${row('Fuera de juego',fsH['Offsides'],fsA['Offsides'])}<div class="data-status">Las estadísticas de un encuentro solo aparecen cuando la fuente las proporciona para ese partido.</div></div>
  <div class="card"><h3>🟨 Disciplina</h3>${row('Amarillas',fsH['Yellow Cards'],fsA['Yellow Cards'])}${row('Rojas',fsH['Red Cards'],fsA['Red Cards'])}${row('Faltas',fsH['Fouls'],fsA['Fouls'])}</div>
  <div class="card"><h3>🎯 Ataque</h3>${row('Tiros totales',fsH['Total Shots'],fsA['Total Shots'])}${row('Tiros a puerta',fsH['Shots on Goal'],fsA['Shots on Goal'])}</div>
  <div class="card analysis-note"><h3>📌 Lectura de datos</h3><p class="muted">Los porcentajes son <b>frecuencias históricas observadas</b>. Por ejemplo, 8 de 10 partidos = 80% de esa muestra. No se presentan como certeza sobre un encuentro futuro.</p><p class="muted">Fuente: ${esc(source)} · Muestra local: ${h.sample||0} · visitante: ${a.sample||0}.</p><p class="muted">Si una competición o temporada no proporciona una estadística, se muestra “Sin datos” en lugar de inventar un valor.</p></div>
 </div>`;
}
