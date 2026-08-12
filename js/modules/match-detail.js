import { matches } from "../data/matches.js";
import { teams } from "../data/teams.js";
import { teamAnalysisView } from "./team-analysis.js";

// La vista de detalle de un partido utiliza el mismo visor histórico que el
// selector manual de equipos. Así no existen dos motores de análisis distintos.
export async function matchDetail(id) {
  const match = matches.find(item => item.id === id);
  if (!match) return `<div class="empty">Partido no encontrado.</div>`;

  const home = teams.find(team => team.competitionId === match.competitionId && team.name === match.home);
  const away = teams.find(team => team.competitionId === match.competitionId && team.name === match.away);

  if (!home || !away) {
    return `<div class="empty"><strong>No se pudo identificar a los dos equipos.</strong><br><span class="muted">${match.home} vs ${match.away}</span></div>`;
  }

  return teamAnalysisView(match.competitionId, home.id, away.id);
}
