import {competitions} from "../data/competitions.js";
import {esc} from "../ui/ui.js";

export function competitionsView(){
  return `
    <div class="section-title">
      <div><h2>Competiciones históricas</h2><span class="muted">Consulta el archivo de temporadas y partidos finalizados.</span></div>
    </div>
    <div class="grid">
      ${competitions.map(c=>`
        <article class="card competition-card historical-open" data-competition="${c.id}">
          <span class="badge">Historial</span>
          <div class="comp-icon">⚽</div>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(c.country)} · Archivo histórico</p>
          <div class="match-action">Explorar historial →</div>
        </article>
      `).join("")}
    </div>
  `;
}
