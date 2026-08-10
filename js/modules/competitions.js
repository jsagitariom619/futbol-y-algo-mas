
import {competitions} from "../data/competitions.js";
import {esc} from "../ui/ui.js";

export function competitionsView(){
  return `
    <div class="section-title">
      <div><h2>Competiciones</h2><span class="muted">Cada tarjeta abre sus fixtures</span></div>
    </div>
    <div class="grid">
      ${competitions.map(c=>`
        <article class="card competition-card comp-open" data-competition="${c.id}">
          <span class="badge ${c.status==="active"?"live":""}">${c.status==="historical"?"Histórica":"Activa"}</span>
          <div class="comp-icon">⚽</div>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(c.country)} · ${esc(c.season)}</p>
          <div class="match-action">Abrir fixtures →</div>
        </article>
      `).join("")}
    </div>
  `;
}
