
import { matches } from "../data/matches.js";
import { competitions } from "../data/competitions.js";
import { esc } from "../ui/ui.js";

export function matchAnalysis(matchId){
  const m = matches.find(x => x.id === matchId);
  if (!m) return `<div class="empty">Partido no encontrado.</div>`;
  const c = competitions.find(x => x.id === m.competitionId);

  return `
    <div class="section-title">
      <div>
        <span class="badge">${esc(c?.name || "Competición")}</span>
        <h2 style="margin-top:8px">${esc(m.home)} <span class="muted">vs</span> ${esc(m.away)}</h2>
      </div>
      <span class="badge">${esc(m.round || "Calendario")}</span>
    </div>

    <div class="card match-meta">
      <b>${new Date(m.date).toLocaleString("es-BO",{dateStyle:"full",timeStyle:"short"})}</b>
    </div>

    <div class="section-title">
      <h2>Análisis estadístico</h2>
      <span class="muted">Histórico verificable</span>
    </div>

    <div class="grid">
      <article class="card stat-focus">
        <span class="stat-icon">⚽</span>
        <h3>Goles</h3>
        <p class="muted">Frecuencias históricas de 1+, 2+ y 3+ goles, calculadas a partir de partidos reales.</p>
        <div class="data-status">Histórico: <b>pendiente de sincronización</b></div>
      </article>

      <article class="card stat-focus">
        <span class="stat-icon">🚩</span>
        <h3>Córners</h3>
        <p class="muted">Promedios a favor, concedidos y distribución histórica.</p>
        <div class="data-status">Histórico: <b>pendiente de sincronización</b></div>
      </article>

      <article class="card stat-focus">
        <span class="stat-icon">🟨</span>
        <h3>Tarjetas</h3>
        <p class="muted">Media y frecuencias observadas por equipo y encuentro.</p>
        <div class="data-status">Histórico: <b>pendiente de sincronización</b></div>
      </article>

      <article class="card stat-focus">
        <span class="stat-icon">🏳️</span>
        <h3>Fuera de juego</h3>
        <p class="muted">Promedios y distribución histórica cuando exista una fuente consistente.</p>
        <div class="data-status">Histórico: <b>pendiente de sincronización</b></div>
      </article>
    </div>

    <div class="card analysis-note">
      <h3>Frecuencia histórica</h3>
      <p class="muted">
        Cuando existan datos suficientes, la plataforma mostrará el resultado de la muestra
        de forma transparente, por ejemplo: <strong>“2+ goles: 8 de 10 partidos (80% histórico)”</strong>.
      </p>
      <p class="muted">
        El porcentaje describe exclusivamente lo observado en la muestra indicada; no representa
        una garantía sobre el siguiente partido.
      </p>
    </div>

    <button class="secondary-btn back-to-matches" data-view="matches">← Volver a fixtures</button>
  `;
}
