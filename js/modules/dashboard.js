import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {esc} from "../ui/ui.js";

export function dashboard(){
  return `
    <div class="hero">
      <div class="card hero-card">
        <span class="badge live">● Visor histórico</span>
        <h2>Historia, resultados y estadísticas de fútbol.</h2>
        <p class="muted">Consulta partidos ya disputados, temporadas anteriores, equipos y estadísticas históricas desde una interfaz clara y educativa.</p>
        <div class="metric-grid">
          <div class="metric"><small>Competiciones</small><b>${competitions.length}</b></div>
          <div class="metric"><small>Clubes catalogados</small><b>${teams.length}</b></div>
          <div class="metric"><small>Temporadas consultables</small><b>3+</b></div>
          <div class="metric"><small>Enfoque</small><b>Histórico</b></div>
        </div>
      </div>

      <div class="card">
        <h3>Cómo leer el visor</h3>
        <p class="muted">Las cifras representan datos observados en partidos y temporadas anteriores. Cuando una estadística no está disponible en la fuente, se muestra como “Sin datos” y no se completa con estimaciones.</p>
        <span class="badge">Histórico · educativo · verificable</span>
      </div>
    </div>

    <div class="section-title">
      <div><h2>Competiciones</h2><span class="muted">Selecciona una competición para explorar su información histórica.</span></div>
    </div>

    <div class="grid">
      ${competitions.slice(0,8).map(c=>`
        <article class="card competition-card comp-open" data-competition="${c.id}">
          <span class="badge">Historial</span>
          <div class="comp-icon">⚽</div>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(c.country)} · Archivo de temporadas</p>
          <div class="match-action">Explorar historial →</div>
        </article>
      `).join("")}
    </div>
  `;
}
