import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {apiSeason} from "../data/league-map.js";
import {getTeamStats,getTeamMatches,getFixtureStats} from "../services/football-api.js";
import {summarizeTeamFixtures,fixtureStatMap,seasonTeamStats} from "../services/statistics.js";

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fmt=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'Fecha no disponible':x.toLocaleString('es-BO',{dateStyle:'full',timeStyle:'short'});};
const val=v=>v===null||v===undefined||v===''?'Sin datos':v;
const pctText=(x,sample)=>x==null?'Sin datos':`${x}% histórico · ${sample} partidos`;
const row=(label,h,a)=>`<div class="stat-row"><span>${label}</span><b>${val(h)}</b><i>vs</i><b>${val(a)}</b></div>`;
const teamByName=name=>teams.find(t=>t.name===name);

function previousSeason(season){return apiSeason(season)-1;}

async function loadTeam(name,competition,season){
  const t=teamByName(name);
  if(!t?.apiId)return {name,history:{sample:0},seasonStats:{sample:0},source:'Equipo sin ID de fuente'};
  const current=apiSeason(season);
  const attempts=[current,previousSeason(season),current-2];
  for(const yr of attempts){
    try{
      const [profile,fixtures]=await Promise.all([
        getTeamStats(t.apiId,competition,yr),
        getTeamMatches(t.apiId,competition,yr,10)
      ]);
      const history=summarizeTeamFixtures(fixtures,t.apiId);
      const seasonStats=seasonTeamStats(profile);
      if(history.sample||seasonStats.sample){
        return {name,history,seasonStats,season:yr,source:`Fuente estadística · temporada ${yr}/${String(yr+1).slice(-2)}`};
      }
    }catch(e){
      if(yr===attempts.at(-1))return {name,history:{sample:0},seasonStats:{sample:0},source:'Fuente estadística no disponible'};
    }
  }
  return {name,history:{sample:0},seasonStats:{sample:0},source:'Sin historial disponible'};
}

export async function matchDetail(id){
 const m=matches.find(x=>x.id===id);if(!m)return `<div class="empty">Partido no encontrado.</div>`;
 const c=competitions.find(x=>x.id===m.competitionId);
 const season=m.season||c?.season||'2026/27';
 const [home,away]=await Promise.all([loadTeam(m.home,m.competitionId,season),loadTeam(m.away,m.competitionId,season)]);
 let fixtureStats=[];
 if(m.apiFixtureId){try{fixtureStats=fixtureStatMap(await getFixtureStats(m.apiFixtureId));}catch{fixtureStats=[];}}
 const h=home.history||{},a=away.history||{},hs=home.seasonStats||{},as=away.seasonStats||{};
 const fsH=fixtureStats.find(x=>x.teamId===teamByName(m.home)?.apiId)||fixtureStats[0]||{};
 const fsA=fixtureStats.find(x=>x.teamId===teamByName(m.away)?.apiId)||fixtureStats[1]||{};
 const sample=Math.min(h.sample||0,a.sample||0);
 const source=[home.source,away.source].filter(Boolean).join(' · ');
 return `<div class="back-link" data-back="matches">← Volver a partidos</div>
 <div class="match-hero card"><span class="badge live">${esc(c?.name||m.competitionId)}</span><div class="match-title"><h2>${esc(m.home)}</h2><div class="vs-big">VS</div><h2>${esc(m.away)}</h2></div><p class="muted">${fmt(m.date)} · ${esc(m.round||'')}</p></div>
 <div class="section-title"><div><h2>Lectura estadística del encuentro</h2><p class="muted">Historial real de ambos equipos. Los porcentajes indican frecuencia observada en la muestra.</p></div></div>
 <div class="analysis-grid">
  <div class="card analysis-feature"><div class="feature-head"><span>⚽</span><div><h3>Goles</h3><small>Frecuencias históricas</small></div></div>
   ${row('Promedio a favor',h.avgFor??hs.avgFor,a.avgFor??as.avgFor)}${row('Promedio recibido',h.avgAgainst??hs.avgAgainst,a.avgAgainst??as.avgAgainst)}${row('Promedio total',h.avgTotal,a.avgTotal)}
   <div class="frequency-grid"><div><span>2+ goles</span><b>${pctText(h.over1,h.sample)}</b></div><div><span>3+ goles</span><b>${pctText(h.over2,h.sample)}</b></div></div>
  </div>
  <div class="card analysis-feature"><div class="feature-head"><span>🚩</span><div><h3>Córners</h3><small>Promedios de temporada</small></div></div>
   ${row('A favor',hs.avgCorners,as.avgCorners)}${row('Concedidos',hs.avgCornersAgainst,as.avgCornersAgainst)}
   <div class="data-status">La frecuencia por rangos aparecerá cuando exista suficiente historial partido a partido.</div>
  </div>
  <div class="card analysis-feature"><div class="feature-head"><span>🟨</span><div><h3>Tarjetas</h3><small>Promedio histórico disponible</small></div></div>
   ${row('Amarillas',hs.yellow,as.yellow)}${row('Rojas',hs.red,as.red)}
  </div>
  <div class="card analysis-feature"><div class="feature-head"><span>🏳️</span><div><h3>Fuera de juego</h3><small>Estadística de partidos</small></div></div>
   ${row('Último encuentro disponible',fsH['Offsides'],fsA['Offsides'])}
   <div class="data-status">No se completa con valores inventados si la fuente no ofrece una serie histórica.</div>
  </div>
  <div class="card analysis-feature"><div class="feature-head"><span>🎯</span><div><h3>Volumen ofensivo</h3><small>Promedios de temporada</small></div></div>
   ${row('Tiros',hs.avgShots,as.avgShots)}${row('Tiros a puerta',hs.avgShotsOnTarget,as.avgShotsOnTarget)}
  </div>
  <div class="card analysis-feature"><div class="feature-head"><span>📚</span><div><h3>Muestra utilizada</h3><small>Origen de los datos</small></div></div>
   ${row('Partidos históricos',h.sample||hs.sample,a.sample||as.sample)}
   <p class="muted" style="margin-bottom:0">${esc(source||'Fuente pendiente de configurar')}</p>
  </div>
  <div class="card analysis-note"><h3>Cómo leer los porcentajes</h3><p class="muted">Un dato como <b>8/10 (80% histórico)</b> significa que el evento ocurrió en 8 de los 10 partidos analizados. Es una frecuencia de la muestra, no una certeza sobre el próximo partido.</p><p class="muted">Si la temporada actual todavía no tiene suficiente muestra, el sistema busca automáticamente la temporada anterior y luego una segunda temporada histórica.</p></div>
 </div>`;
}
