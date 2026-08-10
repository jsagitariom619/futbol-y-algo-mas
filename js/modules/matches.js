
import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
import {esc} from "../ui/ui.js";

const compName = id => competitions.find(c=>c.id===id)?.name || id;

export function matchesView(selected="all"){
  const list = selected==="all" ? matches : matches.filter(m=>m.competitionId===selected);

  return `
    <div class="section-title">
      <div><h2>Fixtures</h2><span class="muted">Calendarios publicados y encuentros registrados</span></div>
    </div>

    <div class="search-row">
      <select id="matchCompetition">
        <option value="all">Todas las competiciones</option>
        ${competitions.filter(c=>c.status==="active").map(c=>
          `<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(c.name)}</option>`
        ).join("")}
      </select>
    </div>

    <div class="grid">
      ${list.map(m=>`
        <article class="card match-card match-open" data-match-id="${m.id}">
          <span class="badge">${esc(compName(m.competitionId))}</span>
          <div class="match-line" style="margin-top:16px">
            <div class="team-name">${esc(m.home)}</div>
            <div class="vs">VS</div>
            <div class="team-name">${esc(m.away)}</div>
          </div>
          <div class="date">${new Date(m.date).toLocaleString("es-BO",{dateStyle:"medium",timeStyle:"short"})} · ${esc(m.round||"")}</div>
          <div class="match-action">Ver análisis estadístico →</div>
        </article>
      `).join("") || `<div class="empty">No hay fixtures registrados para este filtro.</div>`}
    </div>
  `;
}
