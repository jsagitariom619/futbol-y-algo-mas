
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {esc} from "../ui/ui.js";

export function standingsView(selected="premier-league"){
  const active = competitions.filter(c=>c.status==="active");
  const rows = teams.filter(t=>t.competitionId===selected).map((t,i)=>`
    <tr>
      <td>${i+1}</td><td><b>${esc(t.name)}</b></td>
      <td>${t.stats.played||"—"}</td><td>${t.stats.wins||"—"}</td>
      <td>${t.stats.draws||"—"}</td><td>${t.stats.losses||"—"}</td>
      <td>${t.stats.goalsFor||"—"}</td><td>${t.stats.goalsAgainst||"—"}</td>
    </tr>`).join("");

  return `
    <div class="section-title">
      <div><h2>Clasificaciones</h2><span class="muted">Todas las competiciones disponibles</span></div>
    </div>

    <div class="card">
      <div class="search-row">
        <select id="standingCompetition">
          ${active.map(c=>`<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(c.name)} · ${c.season}</option>`).join("")}
        </select>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th></tr></thead>
          <tbody>
            ${rows || `<tr><td colspan="8"><div class="empty">Aún no hay estadísticas sincronizadas para esta competición.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
