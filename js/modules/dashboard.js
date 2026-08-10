
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {matches} from "../data/matches.js";
import {esc} from "../ui/ui.js";

export function dashboard(){
  const active = competitions.filter(c=>c.status==="active");
  return `
    <div class="hero">
      <div class="card hero-card">
        <span class="badge live">● Temporada activa</span>
        <h2>Datos y estadísticas de fútbol, en un solo lugar.</h2>
        <p class="muted">Consulta fixtures, clasificaciones, equipos y análisis estadístico desde una interfaz rápida y pensada para móvil.</p>
        <div class="metric-grid">
          <div class="metric"><small>Competiciones</small><b>${active.length}</b></div>
          <div class="metric"><small>Clubes</small><b>${teams.length}</b></div>
          <div class="metric"><small>Fixtures</small><b>${matches.length}</b></div>
          <div class="metric"><small>PWA</small><b>OK</b></div>
        </div>
      </div>

      <div class="card">
        <h3>Cómo leer los análisis</h3>
        <p class="muted">Las frecuencias históricas se mostrarán con su muestra y fuente. Por ejemplo, 8 de 10 = 80% histórico; no es una garantía del siguiente encuentro.</p>
        <span class="badge">Objetivo · verificable · transparente</span>
      </div>
    </div>

    <div class="section-title">
      <h2>Competiciones</h2><span class="muted">Toca una tarjeta para ver fixtures</span>
    </div>

    <div class="grid">
      ${active.slice(0,8).map(c=>`
        <article class="card competition-card comp-open" data-competition="${c.id}">
          <span class="badge live">Activa</span>
          <div class="comp-icon">⚽</div>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(c.country)} · ${esc(c.season)}</p>
          <div class="match-action">Ver fixtures →</div>
        </article>
      `).join("")}
    </div>
  `;
}
