import {competitions} from "../data/competitions.js";
import {esc} from "../ui/ui.js";
import {getHistoricalMatches} from "../services/historical-data.js";

const SOURCE_CODES={"premier-league":"PL","championship":"ELC","bundesliga":"BL1","bundesliga-2":"BL2","laliga":"PD","ligue-1":"FL1","serie-a":"SA","primeira-liga":"PPL"};
const seasons=["2025","2024","2023"];
const fmtDate=d=>d?new Date(d).toLocaleDateString("es-BO",{day:"2-digit",month:"short",year:"numeric"}):"—";
const avg=a=>a.length?(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2):"Sin datos";
const pct=(n,d)=>d?`${Math.round(n/d*100)}%`:"Sin datos";

function normalize(m){
 const hg=Number(m?.score?.fullTime?.home),ag=Number(m?.score?.fullTime?.away);
 if(!Number.isFinite(hg)||!Number.isFinite(ag))return null;
 return {date:m.utcDate,home:m.homeTeam?.name||"—",away:m.awayTeam?.name||"—",hg,ag,total:hg+ag};
}

export async function competitionHistoryView(id="premier-league",season="2025"){
 const c=competitions.find(x=>x.id===id)||competitions[0],code=SOURCE_CODES[c.id]||c.id;
 let rows=[],error="";
 try{const data=await getHistoricalMatches(code,season,{limit:100});rows=(data||[]).map(normalize).filter(Boolean);}catch(e){error=e?.message||"No se pudo consultar el historial.";}
 const teams=new Set();rows.forEach(r=>{teams.add(r.home);teams.add(r.away)});
 const onePlus=rows.filter(r=>r.total>=1).length,twoPlus=rows.filter(r=>r.total>=2).length,threePlus=rows.filter(r=>r.total>=3).length;
 return `<div class="section-title"><div><h2>${esc(c.name)} · ${esc(season)}/${String(Number(season)+1).slice(-2)}</h2><span class="muted">Archivo de partidos finalizados y estadísticas históricas.</span></div></div>
 <div class="search-row"><select id="competitionSeason">${seasons.map(s=>`<option value="${s}" ${s===season?'selected':''}>${s}/${String(Number(s)+1).slice(-2)}</option>`).join("")}</select></div>
 <div class="grid">
  <article class="card"><span class="badge">Temporada</span><h3>${esc(season)}/${String(Number(season)+1).slice(-2)}</h3><p class="muted">${rows.length} partidos · ${teams.size} equipos encontrados</p></article>
  <article class="card"><span class="badge">Goles</span><h3>${avg(rows.map(r=>r.total))}</h3><p class="muted">promedio por partido</p></article>
  <article class="card"><span class="badge">Frecuencias</span><p>1+ gol: <strong>${pct(onePlus,rows.length)}</strong></p><p>2+ goles: <strong>${pct(twoPlus,rows.length)}</strong></p><p>3+ goles: <strong>${pct(threePlus,rows.length)}</strong></p></article>
 </div>
 <div class="card"><div class="section-title"><div><h3>Partidos históricos</h3><span class="muted">Registros finalizados disponibles en la fuente.</span></div></div>
 ${error?`<div class="empty">${esc(error)}</div>`:rows.length?`<div class="history-list">${rows.map(r=>`<article class="history-row"><div><small>${fmtDate(r.date)}</small><strong>${esc(r.home)}</strong></div><b>${r.hg}–${r.ag}</b><div><strong>${esc(r.away)}</strong><small>${r.total} goles</small></div></article>`).join("")}</div>`:`<div class="empty">No hay partidos históricos disponibles para esta temporada.</div>`}
 </div>`;
}
