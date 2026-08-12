import { getHistoricalTeams, getHistoricalTeamMatches, getHistoricalMatch, normalizeName } from "../services/historical-data.js";

const LEAGUES = [
  ["PL", "Premier League"], ["ELC", "Championship"], ["BL1", "Bundesliga"], ["BL2", "Bundesliga 2"],
  ["PD", "LALIGA"], ["FL1", "Ligue 1"], ["SA", "Serie A"], ["PPL", "Primeira Liga"]
];

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const num=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
const val=v=>v==null?"Sin datos":v;
const pct=(n,d)=>d?`${Math.round(n/d*100)}%`:"Sin datos";
const avg=a=>{const x=a.filter(v=>v!=null);return x.length?Math.round(x.reduce((s,v)=>s+v,0)/x.length*100)/100:null};

function countCards(match){
 const bookings=Array.isArray(match?.bookings)?match.bookings:null;if(!bookings)return{yellow:null,red:null};
 let yellow=0,red=0;for(const item of bookings){const t=String(item?.card||item?.type||"").toUpperCase();if(t==="YELLOW")yellow++;else if(t==="YELLOW_RED"){yellow++;red++}else if(t==="RED")red++}return{yellow,red};
}
function matchRow(m,a,b){
 const h=m?.homeTeam?.id,x=m?.awayTeam?.id;if(!((h===a&&x===b)||(h===b&&x===a)))return null;
 const hg=num(m?.score?.fullTime?.home),ag=num(m?.score?.fullTime?.away);if(hg==null||ag==null)return null;const c=countCards(m);
 return{id:m?.id,date:m?.utcDate||null,home:m?.homeTeam?.name||"Local",away:m?.awayTeam?.name||"Visitante",competition:m?.competition?.name||"Competición no indicada",hg,ag,total:hg+ag,yellow:c.yellow,red:c.red};
}
async function findTeam(league,q){const teams=await getHistoricalTeams(league,2025),t=normalizeName(q);return teams.find(x=>normalizeName(x?.name)===t)||teams.find(x=>normalizeName(x?.shortName)===t)||teams.find(x=>normalizeName(x?.name).includes(t)||t.includes(normalizeName(x?.name)))||null}
async function getTeamMatchesDeep(id){
 const pages=await Promise.all([
  getHistoricalTeamMatches(id,undefined,{limit:500,offset:0,dateFrom:"2010-01-01",dateTo:"2026-12-31"}),
  getHistoricalTeamMatches(id,undefined,{limit:500,offset:500,dateFrom:"2010-01-01",dateTo:"2026-12-31"})
 ]);const map=new Map();pages.flat().forEach(m=>{if(m?.id!=null)map.set(m.id,m)});return[...map.values()];
}
async function getH2H(a,b){
 const [am,bm]=await Promise.all([getTeamMatchesDeep(a.id),getTeamMatchesDeep(b.id)]);const rows=[],seen=new Set();
 for(const m of [...am,...bm]){const r=matchRow(m,a.id,b.id);if(!r||seen.has(r.id))continue;seen.add(r.id);if(r.yellow==null||r.red==null){try{const d=await getHistoricalMatch(r.id),c=countCards(d);r.yellow=c.yellow;r.red=c.red}catch{}}rows.push(r)}
 return rows.sort((x,y)=>new Date(y.date)-new Date(x.date));
}
function selector(a,b){return `<div class="section-title"><div><h2>Historial entre equipos</h2><span class="muted">Busca dos clubes, incluso si pertenecen a ligas diferentes.</span></div><span class="badge">Visor histórico</span></div><div class="card selector-card"><div class="team-selector-grid"><div><label><span>Competición del equipo A</span><select id="analysisLeagueA">${LEAGUES.map(([v,n])=>`<option value="${v}" ${a?.league===v?'selected':''}>${n}</option>`).join("")}</select></label><label style="display:block;margin-top:14px"><span>Equipo A</span><input id="analysisSearchA" list="teamsListA" value="${esc(a?.name||"")}" placeholder="Buscar equipo..." autocomplete="off"><datalist id="teamsListA"></datalist></label></div><div class="selector-vs">VS</div><div><label><span>Competición del equipo B</span><select id="analysisLeagueB">${LEAGUES.map(([v,n])=>`<option value="${v}" ${b?.league===v?'selected':''}>${n}</option>`).join("")}</select></label><label style="display:block;margin-top:14px"><span>Equipo B</span><input id="analysisSearchB" list="teamsListB" value="${esc(b?.name||"")}" placeholder="Buscar equipo..." autocomplete="off"><datalist id="teamsListB"></datalist></label></div></div><p id="teamSearchStatus" class="muted small-note">Selecciona las ligas y escribe el nombre de cada equipo.</p><button id="runTeamAnalysis" class="primary-btn">Consultar historial</button></div>`}
function historySummary(rows){
 const n=rows.length;if(!n)return`<div class="empty"><strong>No se encontraron enfrentamientos históricos.</strong><br><span class="muted">No se inventan datos: la fuente no devolvió partidos coincidentes.</span></div>`;
 const goals=rows.reduce((s,r)=>s+r.total,0),over1=rows.filter(r=>r.total>=2).length,over2=rows.filter(r=>r.total>=3).length;
 const aWins=rows.filter(r=>r.hg>r.ag).length,bWins=rows.filter(r=>r.ag>r.hg).length,draws=rows.filter(r=>r.hg===r.ag).length;
 const y=rows.filter(r=>r.yellow!=null),red=rows.filter(r=>r.red!=null),yg=y.reduce((s,r)=>s+r.yellow,0),rg=red.reduce((s,r)=>s+r.red,0);
 return `<div class="grid"><div class="card"><small>Enfrentamientos</small><h2>${n}</h2><p class="muted">Partidos históricos encontrados.</p></div><div class="card"><small>Promedio de goles</small><h2>${avg(rows.map(r=>r.total))}</h2><p class="muted">${goals} goles acumulados.</p></div><div class="card"><small>2+ goles</small><h2>${pct(over1,n)}</h2><p class="muted">${over1} de ${n} partidos.</p></div><div class="card"><small>3+ goles</small><h2>${pct(over2,n)}</h2><p class="muted">${over2} de ${n} partidos.</p></div><div class="card"><small>Resultados</small><h2>${aWins} · ${draws} · ${bWins}</h2><p class="muted">Victoria local · empate · victoria visitante.</p></div><div class="card"><small>Tarjetas</small><h2>${y.length?yg:"Sin datos"}</h2><p class="muted">${y.length?`Amarillas registradas en ${y.length}/${n} partidos.`:"La fuente no proporcionó amarillas."}</p></div><div class="card"><small>Expulsiones</small><h2>${red.length?rg:"Sin datos"}</h2><p class="muted">${red.length?`Rojas registradas en ${red.length}/${n} partidos.`:"La fuente no proporcionó rojas."}</p></div></div>`;
}
function renderMatches(rows){if(!rows.length)return"";return`<div class="card"><div class="section-title"><div><h3>Partidos encontrados</h3><span class="muted">Historial real disponible en la fuente</span></div><span class="badge">${rows.length} partidos</span></div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Competición</th><th>Local</th><th>Resultado</th><th>Visitante</th><th>Amarillas</th><th>Rojas</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.date?new Date(r.date).toLocaleDateString("es-BO"):"Sin datos"}</td><td>${esc(r.competition)}</td><td>${esc(r.home)}</td><td><strong>${r.hg} - ${r.ag}</strong></td><td>${esc(r.away)}</td><td>${val(r.yellow)}</td><td>${val(r.red)}</td></tr>`).join("")}</tbody></table></div></div>`}
async function loadTeamsFor(league,listId){const list=document.querySelector(`#${listId}`);if(!list)return[];list.innerHTML="";try{const teams=await getHistoricalTeams(league,2025);list.innerHTML=teams.sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(t=>`<option value="${esc(t.name)}"></option>`).join("");const s=document.querySelector("#teamSearchStatus");if(s)s.textContent=`${teams.length} equipos disponibles para esta competición.`;return teams}catch{const s=document.querySelector("#teamSearchStatus");if(s)s.textContent="No se pudo cargar la lista de equipos.";return[]}}
export async function teamAnalysisView(leagueA="PL",teamAName="",leagueB="PL",teamBName=""){
 const a=teamAName?{league:leagueA,name:teamAName}:null,b=teamBName?{league:leagueB,name:teamBName}:null,base=selector(a,b);if(!teamAName||!teamBName)return base;
 try{const[ta,tb]=await Promise.all([findTeam(leagueA,teamAName),findTeam(leagueB,teamBName)]);if(!ta||!tb)return base+`<div class="empty">No se pudo identificar uno de los equipos en la fuente histórica.</div>`;const rows=await getH2H(ta,tb);return base+`<div class="analysis-header-card card"><span class="badge live">Historial puro</span><div class="match-title"><h2>${esc(ta.name)}</h2><div class="vs-big">VS</div><h2>${esc(tb.name)}</h2></div><p class="muted">${esc(leagueName(leagueA))} · ${esc(leagueName(leagueB))}. Solo se muestran antecedentes históricos encontrados.</p></div>${historySummary(rows)}${renderMatches(rows)}<div class="card analysis-note"><h3>Lectura histórica</h3><p class="muted">Estos porcentajes describen la frecuencia observada en los partidos encontrados. No son predicciones ni recomendaciones.</p></div>`}catch(e){return base+`<div class="empty"><strong>No se pudo consultar el historial.</strong><br><span class="muted">${esc(e.message)}</span></div>`}}
function leagueName(code){return LEAGUES.find(([v])=>v===code)?.[1]||code}
export function bindTeamAnalysis(){const loadA=()=>loadTeamsFor(document.querySelector("#analysisLeagueA")?.value||"PL","teamsListA"),loadB=()=>loadTeamsFor(document.querySelector("#analysisLeagueB")?.value||"PL","teamsListB");loadA();loadB();document.querySelector("#analysisLeagueA")?.addEventListener("change",loadA);document.querySelector("#analysisLeagueB")?.addEventListener("change",loadB)}
export function getSelectedTeamSearch(){return{leagueA:document.querySelector("#analysisLeagueA")?.value||"PL",teamA:document.querySelector("#analysisSearchA")?.value?.trim()||"",leagueB:document.querySelector("#analysisLeagueB")?.value||"PL",teamB:document.querySelector("#analysisSearchB")?.value?.trim()||""}}
