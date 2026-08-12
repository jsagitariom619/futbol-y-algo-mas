import {teams} from "../data/teams.js";
import {competitions} from "../data/competitions.js";
import {getHistoricalTeams,getHistoricalTeamMatches,getHistoricalMatches,findHistoricalTeam} from "../services/historical-data.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const avg=a=>{const x=a.filter(v=>v!=null);return x.length?Math.round(x.reduce((s,v)=>s+v,0)/x.length*100)/100:null};
const pct=(numv,den)=>den?Math.round(numv/den*100):null;
const val=v=>v==null?'Sin datos':v;
const freq=(count,total)=>count==null||!total?'Sin datos':`${count}/${total} (${pct(count,total)}%)`;

function previousYears(season){
  const start=Number(String(season||'2026/27').slice(0,4));
  return [start-1,start-2,start-3];
}

function normalizeMatch(match,teamId){
  const homeId=match?.homeTeam?.id;
  const awayId=match?.awayTeam?.id;
  const isHome=homeId===teamId;
  if(!isHome&&awayId!==teamId)return null;
  const gf=num(isHome?match?.score?.fullTime?.home:match?.score?.fullTime?.away);
  const ga=num(isHome?match?.score?.fullTime?.away:match?.score?.fullTime?.home);
  if(gf==null||ga==null)return null;
  return {gf,ga,total:gf+ga,date:match?.utcDate||null,venue:isHome?'home':'away',opponent:isHome?match?.awayTeam?.name:match?.homeTeam?.name};
}

async function historicalTeam(team,competition,season){
  const years=previousYears(season);
  const rows=[];
  const seasons=[];
  const ids=[];

  for(const year of years){
    try{
      const historicalTeams=await getHistoricalTeams(competition,year);
      const ht=findHistoricalTeam(historicalTeams,team.name);
      if(!ht?.id)continue;
      ids.push(ht.id);
      const matches=await getHistoricalTeamMatches(ht.id,year,{limit:100});
      const finished=matches.map(m=>normalizeMatch(m,ht.id)).filter(Boolean);
      if(finished.length){seasons.push(year);rows.push(...finished);}
    }catch(error){
      console.warn('Historical season unavailable',competition,year,error);
    }
  }

  rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=rows.length;
  return {
    team,ids,rows,seasons,sample:total,
    avgFor:avg(rows.map(r=>r.gf)),
    avgAgainst:avg(rows.map(r=>r.ga)),
    avgTotal:avg(rows.map(r=>r.total)),
    onePlus:pct(rows.filter(r=>r.total>=1).length,total),
    twoPlus:pct(rows.filter(r=>r.total>=2).length,total),
    threePlus:pct(rows.filter(r=>r.total>=3).length,total),
    cleanSheets:pct(rows.filter(r=>r.ga===0).length,total),
    over25:pct(rows.filter(r=>r.total>=3).length,total)
  };
}

async function historicalH2H(home,away,competition,season){
  const years=previousYears(season);
  const rows=[];
  for(const year of years){
    try{
      const matches=await getHistoricalMatches(competition,year,{limit:100});
      for(const m of matches){
        const hn=m?.homeTeam?.name||'', an=m?.awayTeam?.name||'';
        const same=(hn===home.name&&an===away.name)||(hn===away.name&&an===home.name);
        if(!same)continue;
        const hg=num(m?.score?.fullTime?.home),ag=num(m?.score?.fullTime?.away);
        if(hg!=null&&ag!=null)rows.push({hg,ag,total:hg+ag,date:m?.utcDate});
      }
    }catch{}
  }
  return {sample:rows.length,avgTotal:avg(rows.map(r=>r.total)),twoPlus:pct(rows.filter(r=>r.total>=2).length,rows.length),threePlus:pct(rows.filter(r=>r.total>=3).length,rows.length),rows};
}

function teamCard(label,d){
 return `<div class="card team-analysis-card"><div class="team-analysis-head"><div><span class="badge live">Historial · ${d.seasons.length} temporadas</span><h3>${esc(label)}</h3></div><strong>${d.sample}</strong></div>
 <div class="team-analysis-grid">
  <div><small>GF / partido</small><b>${val(d.avgFor)}</b></div><div><small>GC / partido</small><b>${val(d.avgAgainst)}</b></div><div><small>Goles totales</small><b>${val(d.avgTotal)}</b></div><div><small>Porterías a cero</small><b>${d.cleanSheets==null?'Sin datos':d.cleanSheets+'%'}</b></div>
  <div><small>Córners a favor</small><b>Sin datos</b></div><div><small>Córners concedidos</small><b>Sin datos</b></div><div><small>Amarillas</small><b>Sin datos</b></div><div><small>Tiros a puerta</small><b>Sin datos</b></div>
 </div>
 <div class="frequency-grid"><div><span>1+ gol</span><b>${d.onePlus==null?'Sin datos':d.onePlus+'%'}</b></div><div><span>2+ goles</span><b>${d.twoPlus==null?'Sin datos':d.twoPlus+'%'}</b></div><div><span>3+ goles</span><b>${d.threePlus==null?'Sin datos':d.threePlus+'%'}</b></div></div>
 <p class="muted small-note">Muestra: ${d.sample} partidos finalizados · temporadas: ${d.seasons.length?d.seasons.join(', '):'sin datos'}.</p></div>`;
}

export async function teamAnalysisView(competitionId,homeId='',awayId=''){
 const c=competitions.find(x=>x.id===competitionId)||competitions[0];
 const pool=teams.filter(t=>t.competitionId===c.id).sort((a,b)=>a.name.localeCompare(b.name));
 if(!homeId||!awayId)return selector(c.id,pool,homeId,awayId);
 const home=pool.find(t=>t.id===homeId),away=pool.find(t=>t.id===awayId);
 if(!home||!away)return selector(c.id,pool,homeId,awayId)+`<div class="empty">Selecciona dos equipos válidos.</div>`;
 try{
   const [hd,ad,h2h]=await Promise.all([
     historicalTeam(home,c.id,c.season),
     historicalTeam(away,c.id,c.season),
     historicalH2H(home,away,c.id,c.season)
   ]);
   return selector(c.id,pool,homeId,awayId)+`<div class="analysis-header-card card"><span class="badge live">Análisis histórico</span><div class="match-title"><h2>${esc(home.name)}</h2><div class="vs-big">VS</div><h2>${esc(away.name)}</h2></div><p class="muted">Datos reales de partidos finalizados de las tres temporadas anteriores disponibles. No se generan números cuando la fuente no los proporciona.</p></div>
   <div class="analysis-grid">${teamCard(home.name,hd)}${teamCard(away.name,ad)}
    <div class="card analysis-feature"><div class="feature-head"><span>⚽</span><div><h3>Goles · frecuencia histórica</h3><small>Partidos realmente disputados</small></div></div>${row('Promedio total',hd.avgTotal,ad.avgTotal)}${row('2+ goles',hd.twoPlus,ad.twoPlus,'pct')}${row('3+ goles',hd.threePlus,ad.threePlus,'pct')}</div>
    <div class="card analysis-feature"><div class="feature-head"><span>🤝</span><div><h3>Enfrentamientos directos</h3><small>Cuando existen en las temporadas consultadas</small></div></div>${row('Partidos H2H',h2h.sample,h2h.sample)}${row('Promedio de goles',h2h.avgTotal,h2h.avgTotal)}${row('2+ goles',h2h.twoPlus,h2h.twoPlus,'pct')}${row('3+ goles',h2h.threePlus,h2h.threePlus,'pct')}</div>
    <div class="card analysis-feature"><div class="feature-head"><span>🚩</span><div><h3>Córners y disciplina</h3><small>La fuente histórica actual no entrega estos campos</small></div></div>${row('Córners',null,null)}${row('Tarjetas amarillas',null,null)}${row('Tiros a puerta',null,null)}<p class="muted small-note">Se mantienen como “Sin datos” en lugar de inventar valores.</p></div>
    <div class="card analysis-note"><h3>Fuente y muestra</h3><p class="muted">La ficha se alimenta de partidos históricos reales. Los porcentajes son frecuencias observadas dentro de la muestra y no constituyen una predicción del próximo encuentro.</p></div>
   </div>`;
 }catch(error){console.error(error);return selector(c.id,pool,homeId,awayId)+`<div class="empty">No fue posible cargar el historial. Revisa el deployment de Vercel y la conexión con Football-Data.org.</div>`;}
}

function row(label,h,a,type='number'){const fmt=v=>v==null?'Sin datos':type==='pct'?`${v}%`:v;return `<div class="stat-row"><span>${label}</span><b>${fmt(h)}</b><i>vs</i><b>${fmt(a)}</b></div>`;}
function selector(compId,pool,homeId,awayId){return `<div class="section-title"><div><h2>Analizar dos equipos</h2><span class="muted">Selecciona una competición y dos equipos para consultar su historial real.</span></div></div><div class="card selector-card"><div class="search-row"><select id="analysisCompetition">${competitions.map(c=>`<option value="${c.id}" ${c.id===compId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="team-selector-grid"><label><span>Equipo A</span><select id="analysisHome"><option value="">Seleccionar equipo</option>${pool.map(t=>`<option value="${t.id}" ${t.id===homeId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><div class="selector-vs">VS</div><label><span>Equipo B</span><select id="analysisAway"><option value="">Seleccionar equipo</option>${pool.map(t=>`<option value="${t.id}" ${t.id===awayId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label></div><button id="runTeamAnalysis" class="primary-btn">Analizar historial</button></div>`;}
