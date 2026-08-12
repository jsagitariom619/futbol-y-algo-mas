import {teams} from "../data/teams.js";
import {competitions} from "../data/competitions.js";
import {getTeamMatches,getTeamStats,getHeadToHead} from "../services/football-api.js";
import {summarizeTeamFixtures,seasonTeamStats} from "../services/statistics.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));
const n=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const avg=a=>{const x=a.filter(nv=>nv!=null);return x.length?Math.round(x.reduce((s,v)=>s+v,0)/x.length*100)/100:null};
const pct=(num,den)=>den?Math.round(num/den*100):null;
const val=v=>v==null?'Sin datos':v;
const freq=(num,den)=>num==null||den==null?"Sin datos":`${num}/${den} (${pct(num,den)}% histórico)`;

function yearsFor(season){
  const y=Number(String(season).slice(0,4));
  return [y-1,y-2,y-3].filter(Number.isFinite);
}

function rowsFrom(fixtures,teamId){
  const response=fixtures?.response||[];
  return response.filter(f=>['FT','AET','PEN'].includes(f?.fixture?.status?.short))
    .map(f=>{
      const home=f?.teams?.home?.id===teamId;
      const gf=n(home?f?.goals?.home:f?.goals?.away);
      const ga=n(home?f?.goals?.away:f?.goals?.home);
      return {gf,ga,total:gf!=null&&ga!=null?gf+ga:null,venue:home?'home':'away',date:f?.fixture?.date||null};
    }).filter(r=>r.gf!=null&&r.ga!=null);
}

async function historicalTeam(team,competition,season){
  const years=yearsFor(season);
  const chunks=await Promise.all(years.map(async year=>{
    try{
      const [fixtures,profile]=await Promise.all([
        getTeamMatches(team.apiId,competition,`${year}/${String(year+1).slice(-2)}`,20),
        getTeamStats(team.apiId,competition,`${year}/${String(year+1).slice(-2)}`)
      ]);
      return {year,rows:rowsFrom(fixtures,team.apiId),season:seasonTeamStats(profile)};
    }catch{return {year,rows:[],season:{sample:0}};}
  }));

  const rows=chunks.flatMap(x=>x.rows).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=rows.length;
  const totals=rows.map(r=>r.total);
  const home=rows.filter(r=>r.venue==='home');
  const away=rows.filter(r=>r.venue==='away');
  const seasonSamples=chunks.reduce((s,x)=>s+(x.season.sample||0),0);
  const weighted=(field)=>{
    let numerator=0,den=0;
    for(const x of chunks){const games=x.season.sample||0;const v=x.season[field];if(games&&v!=null){numerator+=v*games;den+=games;}}
    return den?Math.round(numerator/den*100)/100:null;
  };
  return {
    team, rows, sample:total, seasons:chunks.filter(x=>x.rows.length||x.season.sample).map(x=>x.year),
    avgFor:avg(rows.map(r=>r.gf)), avgAgainst:avg(rows.map(r=>r.ga)), avgTotal:avg(totals),
    over1:pct(rows.filter(r=>r.total>=2).length,total), over2:pct(rows.filter(r=>r.total>=3).length,total),
    over0:pct(rows.filter(r=>r.total>=1).length,total), cleanSheets:pct(rows.filter(r=>r.ga===0).length,total),
    homeAvg:avg(home.map(r=>r.gf)), awayAvg:avg(away.map(r=>r.gf)),
    avgCorners:weighted('avgCorners'), avgCornersAgainst:weighted('avgCornersAgainst'),
    avgShots:weighted('avgShots'), avgShotsOnTarget:weighted('avgShotsOnTarget'),
    yellow:weighted('yellow'), red:weighted('red'), seasonSamples
  };
}

function aggregateH2H(payload,homeId,awayId){
  const rows=(payload?.response||[]).filter(f=>['FT','AET','PEN'].includes(f?.fixture?.status?.short)).map(f=>{
    const hg=n(f?.goals?.home), ag=n(f?.goals?.away); if(hg==null||ag==null)return null;
    const homeIsSelected=f?.teams?.home?.id===homeId;
    return {home:f?.teams?.home?.id, hg, ag, total:hg+ag, selectedFor:homeIsSelected?hg:ag, selectedAgainst:homeIsSelected?ag:hg, date:f?.fixture?.date};
  }).filter(Boolean);
  return {sample:rows.length, avgTotal:avg(rows.map(r=>r.total)), over1:pct(rows.filter(r=>r.total>=2).length,rows.length),over2:pct(rows.filter(r=>r.total>=3).length,rows.length),rows};
}

function teamCard(label,d){
 return `<div class="card team-analysis-card"><div class="team-analysis-head"><div><span class="badge live">Historial · ${d.seasons.length} temporadas</span><h3>${esc(label)}</h3></div><strong>${d.sample}</strong></div>
 <div class="team-analysis-grid">
  <div><small>GF / partido</small><b>${val(d.avgFor)}</b></div><div><small>GC / partido</small><b>${val(d.avgAgainst)}</b></div><div><small>Goles totales</small><b>${val(d.avgTotal)}</b></div><div><small>Porterías a cero</small><b>${d.cleanSheets==null?'Sin datos':d.cleanSheets+'%'}</b></div>
  <div><small>Córners a favor</small><b>${val(d.avgCorners)}</b></div><div><small>Córners concedidos</small><b>${val(d.avgCornersAgainst)}</b></div><div><small>Amarillas</small><b>${val(d.yellow)}</b></div><div><small>Tiros a puerta</small><b>${val(d.avgShotsOnTarget)}</b></div>
 </div>
 <div class="frequency-grid"><div><span>1+ gol</span><b>${freq(d.over0,d.sample)}</b></div><div><span>2+ goles</span><b>${freq(d.over1,d.sample)}</b></div><div><span>3+ goles</span><b>${freq(d.over2,d.sample)}</b></div></div>
 <p class="muted small-note">Temporadas consultadas: ${d.seasons.length?d.seasons.join(', '):'sin datos'}.</p></div>`;
}

export async function teamAnalysisView(competitionId,homeId='',awayId=''){
 const c=competitions.find(x=>x.id===competitionId)||competitions[0];
 const pool=teams.filter(t=>t.competitionId===c.id).sort((a,b)=>a.name.localeCompare(b.name));
 if(!homeId||!awayId){
  return selector(c.id,pool,homeId,awayId);
 }
 const home=pool.find(t=>t.id===homeId),away=pool.find(t=>t.id===awayId);
 if(!home||!away)return selector(c.id,pool,homeId,awayId)+`<div class="empty">Selecciona dos equipos válidos.</div>`;
 appLoading();
 try{
   const [hd,ad,h2hPayload]=await Promise.all([historicalTeam(home,c.id,c.season),historicalTeam(away,c.id,c.season),getHeadToHead(home.apiId,away.apiId,20).catch(()=>({response:[]}))]);
   const h2h=aggregateH2H(h2hPayload,home.apiId,away.apiId);
   return selector(c.id,pool,homeId,awayId)+`<div class="analysis-header-card card"><span class="badge live">Análisis histórico</span><div class="match-title"><h2>${esc(home.name)}</h2><div class="vs-big">VS</div><h2>${esc(away.name)}</h2></div><p class="muted">La ficha usa partidos reales de las tres temporadas anteriores disponibles y enfrentamientos directos cuando existen.</p></div>
   <div class="analysis-grid">${teamCard(home.name,hd)}${teamCard(away.name,ad)}
    <div class="card analysis-feature"><div class="feature-head"><span>⚽</span><div><h3>Comparación histórica de goles</h3><small>Frecuencia observada</small></div></div>${row('Promedio de goles',hd.avgTotal,ad.avgTotal)}${row('2+ goles',hd.over1,ad.over1)}${row('3+ goles',hd.over2,ad.over2)}<p class="muted small-note">Los porcentajes son frecuencias históricas de cada equipo, no una predicción del siguiente partido.</p></div>
    <div class="card analysis-feature"><div class="feature-head"><span>🚩</span><div><h3>Córners</h3><small>Promedios históricos</small></div></div>${row('A favor',hd.avgCorners,ad.avgCorners)}${row('Concedidos',hd.avgCornersAgainst,ad.avgCornersAgainst)}${row('Tiros a puerta',hd.avgShotsOnTarget,ad.avgShotsOnTarget)}</div>
    <div class="card analysis-feature"><div class="feature-head"><span>🟨</span><div><h3>Disciplina</h3><small>Promedios históricos disponibles</small></div></div>${row('Amarillas',hd.yellow,ad.yellow)}${row('Rojas',hd.red,ad.red)}</div>
    <div class="card analysis-feature"><div class="feature-head"><span>🤝</span><div><h3>Enfrentamientos directos</h3><small>Hasta 20 encuentros disponibles</small></div></div>${row('Muestra H2H',h2h.sample,h2h.sample)}${row('Promedio de goles',h2h.avgTotal,h2h.avgTotal)}${row('2+ goles',h2h.over1,h2h.over1)}${row('3+ goles',h2h.over2,h2h.over2)}</div>
    <div class="card analysis-note"><h3>Fuente y muestra</h3><p class="muted">Se consultan temporadas anteriores para evitar que un inicio de temporada deje la ficha vacía. Cada cifra muestra la muestra sobre la que fue calculada. Si una estadística no está disponible en la fuente, se mantiene como “Sin datos”.</p></div>
   </div>`;
 }catch(e){return selector(c.id,pool,homeId,awayId)+`<div class="empty">No fue posible cargar el historial ahora. Comprueba la conexión de datos estadísticos y vuelve a intentarlo.</div>`;}
}

function row(label,h,a){return `<div class="stat-row"><span>${label}</span><b>${val(h)}</b><i>vs</i><b>${val(a)}</b></div>`;}
function selector(compId,pool,homeId,awayId){return `<div class="section-title"><div><h2>Analizar dos equipos</h2><span class="muted">Selecciona una competición y dos equipos. No necesitas recorrer todos los fixtures.</span></div></div><div class="card selector-card"><div class="search-row"><select id="analysisCompetition">${competitions.map(c=>`<option value="${c.id}" ${c.id===compId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="team-selector-grid"><label><span>Equipo local / Equipo A</span><select id="analysisHome"><option value="">Seleccionar equipo</option>${pool.map(t=>`<option value="${t.id}" ${t.id===homeId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><div class="selector-vs">VS</div><label><span>Equipo visitante / Equipo B</span><select id="analysisAway"><option value="">Seleccionar equipo</option>${pool.map(t=>`<option value="${t.id}" ${t.id===awayId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label></div><button id="runTeamAnalysis" class="primary-btn">Analizar historial</button></div>`;}
function appLoading(){/* render is async; UI remains responsive */}
