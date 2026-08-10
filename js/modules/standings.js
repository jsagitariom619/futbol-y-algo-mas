
import {teams} from "../data/teams.js";
export function standingsView(){
 const rows=teams.filter(t=>["premier-league","laliga","bundesliga"].includes(t.competitionId)).map((t,i)=>`<tr><td>${i+1}</td><td><b>${t.name}</b></td><td>${t.stats.played}</td><td>${t.stats.wins}</td><td>${t.stats.draws}</td><td>${t.stats.losses}</td><td>${t.stats.goalsFor}</td><td>${t.stats.goalsAgainst}</td><td>${t.stats.goalsFor-t.stats.goalsAgainst}</td></tr>`).join("");
 return `<div class="section-title"><h2>Clasificaciones</h2><span class="muted">Sección preparada para datos en vivo</span></div><div class="card"><div class="search-row"><select><option>Competición de ejemplo</option><option>Premier League</option><option>LALIGA</option><option>Bundesliga</option></select></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="margin-bottom:0">Los ceros indican que todavía no se ha sincronizado la estadística de resultados.</p></div>`;
}
