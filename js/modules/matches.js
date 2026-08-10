import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
const compName=id=>competitions.find(c=>c.id===id)?.name||id;
const fmt=d=>new Date(d).toLocaleString("es-BO",{dateStyle:"medium",timeStyle:"short"});
export function matchesView(filter=""){
 const list=matches.filter(m=>!filter||m.competitionId===filter);
 return `<div class="section-title"><div><h2>Fixtures</h2><p class="muted">Calendarios publicados y encuentros pendientes.</p></div><span class="muted">${list.length} encuentros cargados</span></div>
 <div class="filter-bar"><select id="fixtureCompetition"><option value="">Todas las competiciones</option>${competitions.map(c=>`<option value="${c.id}" ${filter===c.id?'selected':''}>${c.name}</option>`).join("")}</select><select id="fixtureRound"><option value="">Todas las jornadas</option><option value="J1">Jornada 1</option></select></div>
 <div class="grid">${list.map(m=>`<button class="card match-card interactive-card" data-open-match="${m.id}"><div class="card-top"><span class="badge">${compName(m.competitionId)}</span><span class="arrow">→</span></div><div class="match-line"><div class="team-name">${m.home}</div><div class="vs">VS</div><div class="team-name">${m.away}</div></div><div class="date">${fmt(m.date)} · ${m.round}</div><div class="match-foot"><span>Ver análisis estadístico</span><span class="source-mini">${m.source}</span></div></button>`).join("") || `<div class="empty">No hay partidos cargados para este filtro.</div>`}</div>`;
}
export function bindMatchFilters(render){const s=document.querySelector('#fixtureCompetition');if(s)s.onchange=()=>render('matches',s.value)}
