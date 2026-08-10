
import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
const name=id=>competitions.find(c=>c.id===id)?.name||id;
export function matchesView(){
 return `<div class="section-title"><h2>Partidos</h2><span class="muted">Próximos encuentros</span></div>
 <div class="grid">${matches.map(m=>`<article class="card match-card"><span class="badge">${name(m.competitionId)}</span><div class="match-line" style="margin-top:16px"><div class="team-name">${m.home}</div><div class="vs">VS</div><div class="team-name">${m.away}</div></div><div class="date">${new Date(m.date).toLocaleString("es-BO",{dateStyle:"medium",timeStyle:"short"})}</div></article>`).join("")}</div>`;
}
