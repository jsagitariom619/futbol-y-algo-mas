import { getHistoricalTeams, getHistoricalTeamMatches, getHistoricalMatch, normalizeName } from "../services/historical-data.js";

const LEAGUES = [
  ["PL", "Premier League"], ["ELC", "Championship"], ["BL1", "Bundesliga"], ["BL2", "Bundesliga 2"],
  ["PD", "LALIGA"], ["FL1", "Ligue 1"], ["SA", "Serie A"], ["PPL", "Primeira Liga"]
];

const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));
const num = v => typeof v === "number" && Number.isFinite(v) ? v : null;
const val = v => v == null ? "Sin datos" : v;
const avg = a => { const x = a.filter(v => v != null); return x.length ? Math.round(x.reduce((s,v)=>s+v,0)/x.length*100)/100 : null; };

function previousYears() { return [2025, 2024, 2023]; }

function countCards(match) {
  const bookings = Array.isArray(match?.bookings) ? match.bookings : null;
  if (!bookings) return {yellow:null, red:null};
  let yellow = 0, red = 0;
  for (const item of bookings) {
    const type = String(item?.card || item?.type || "").toLowerCase();
    if (type.includes("red") || type.includes("second") || type.includes("straight")) red++;
    else if (type.includes("yellow")) yellow++;
  }
  return {yellow, red};
}

function matchRow(match, teamAId, teamBId) {
  const homeId = match?.homeTeam?.id;
  const awayId = match?.awayTeam?.id;
  const sameTeams = (homeId === teamAId && awayId === teamBId) || (homeId === teamBId && awayId === teamAId);
  if (!sameTeams) return null;
  const hg = num(match?.score?.fullTime?.home), ag = num(match?.score?.fullTime?.away);
  if (hg == null || ag == null) return null;
  const cards = countCards(match);
  return {id:match?.id,date:match?.utcDate||null,home:match?.homeTeam?.name||"Local",away:match?.awayTeam?.name||"Visitante",hg,ag,total:hg+ag,status:match?.status||"FINISHED",yellow:cards.yellow,red:cards.red};
}

async function findTeam(league, query) {
  const teams = await getHistoricalTeams(league, 2025);
  const target = normalizeName(query);
  return teams.find(t => normalizeName(t?.name) === target)
    || teams.find(t => normalizeName(t?.shortName) === target)
    || teams.find(t => normalizeName(t?.name).includes(target) || target.includes(normalizeName(t?.name)))
    || null;
}

async function getH2H(teamA, teamB) {
  const rows = [];
  for (const season of previousYears()) {
    try {
      const [aMatches, bMatches] = await Promise.all([
        getHistoricalTeamMatches(teamA.id, season, {limit:100}),
        getHistoricalTeamMatches(teamB.id, season, {limit:100})
      ]);
      const byId = new Map();
      [...aMatches, ...bMatches].forEach(m => { if (m?.id != null) byId.set(m.id, m); });
      for (const match of byId.values()) {
        const row = matchRow(match, teamA.id, teamB.id);
        if (!row || rows.some(r => r.id === row.id)) continue;
        // El resumen de partidos puede no incluir tarjetas. Solo en los H2H encontrados
        // se consulta el detalle para intentar recuperar amarillas/rojas cuando la fuente las ofrece.
        if (row.yellow == null || row.red == null) {
          try {
            const detail = await getHistoricalMatch(row.id);
            const detailedCards = countCards(detail);
            row.yellow = detailedCards.yellow;
            row.red = detailedCards.red;
          } catch {}
        }
        rows.push({...row, season});
      }
    } catch (error) {
      console.warn("H2H historical season unavailable", season, error);
    }
  }
  return rows.sort((a,b) => new Date(b.date) - new Date(a.date));
}

function selector(teamA, teamB) {
  return `<div class="section-title"><div><h2>Historial entre equipos</h2><span class="muted">Busca dos clubes, incluso si pertenecen a ligas diferentes.</span></div><span class="badge">Visor histórico</span></div>
  <div class="card selector-card"><div class="team-selector-grid">
    <div><label><span>Competición del equipo A</span><select id="analysisLeagueA">${LEAGUES.map(([v,n]) => `<option value="${v}" ${teamA?.league===v?'selected':''}>${n}</option>`).join("")}</select></label>
    <label style="display:block;margin-top:14px"><span>Equipo A</span><input id="analysisSearchA" list="teamsListA" value="${esc(teamA?.name||"")}" placeholder="Buscar equipo..." autocomplete="off"><datalist id="teamsListA"></datalist></label></div>
    <div class="selector-vs">VS</div>
    <div><label><span>Competición del equipo B</span><select id="analysisLeagueB">${LEAGUES.map(([v,n]) => `<option value="${v}" ${teamB?.league===v?'selected':''}>${n}</option>`).join("")}</select></label>
    <label style="display:block;margin-top:14px"><span>Equipo B</span><input id="analysisSearchB" list="teamsListB" value="${esc(teamB?.name||"")}" placeholder="Buscar equipo..." autocomplete="off"><datalist id="teamsListB"></datalist></label></div>
  </div><p id="teamSearchStatus" class="muted small-note">Selecciona las ligas y escribe el nombre de cada equipo.</p><button id="runTeamAnalysis" class="primary-btn">Consultar historial</button></div>`;
}

function summaryCard(rows) {
  const total = rows.length, goals = rows.reduce((s,r)=>s+r.total,0);
  const yellow = rows.map(r=>r.yellow).filter(v=>v!=null), red = rows.map(r=>r.red).filter(v=>v!=null);
  return `<div class="grid">
    <div class="card"><small>Enfrentamientos encontrados</small><h2>${total}</h2><p class="muted">Partidos históricos coincidentes entre ambos clubes.</p></div>
    <div class="card"><small>Goles acumulados</small><h2>${goals}</h2><p class="muted">Promedio: ${val(avg(rows.map(r=>r.total)))} por partido.</p></div>
    <div class="card"><small>Tarjetas amarillas</small><h2>${yellow.length ? yellow.reduce((s,v)=>s+v,0) : "Sin datos"}</h2><p class="muted">${yellow.length ? `Disponible en ${yellow.length} de ${total} partidos.` : "La fuente no proporcionó este dato."}</p></div>
    <div class="card"><small>Expulsiones</small><h2>${red.length ? red.reduce((s,v)=>s+v,0) : "Sin datos"}</h2><p class="muted">${red.length ? `Disponible en ${red.length} de ${total} partidos.` : "La fuente no proporcionó este dato."}</p></div>
  </div>`;
}

function renderMatches(rows) {
  if (!rows.length) return `<div class="empty"><strong>No se encontraron enfrentamientos históricos.</strong><br><span class="muted">No hay partidos coincidentes en las tres temporadas consultadas o la fuente no los tiene registrados.</span></div>`;
  return `<div class="card"><div class="section-title"><div><h3>Partidos encontrados</h3><span class="muted">Historial real disponible</span></div><span class="badge">${rows.length} partidos</span></div>
    <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Local</th><th>Resultado</th><th>Visitante</th><th>Amarillas</th><th>Rojas</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${r.date ? new Date(r.date).toLocaleDateString("es-BO") : "Sin datos"}</td><td>${esc(r.home)}</td><td><strong>${r.hg} - ${r.ag}</strong></td><td>${esc(r.away)}</td><td>${val(r.yellow)}</td><td>${val(r.red)}</td></tr>`).join("")}
    </tbody></table></div></div>`;
}

async function loadTeamsFor(league, listId, statusLabel) {
  const list = document.querySelector(`#${listId}`);
  if (!list) return [];
  list.innerHTML = "";
  try {
    const teams = await getHistoricalTeams(league, 2025);
    list.innerHTML = teams.sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(t=>`<option value="${esc(t.name)}"></option>`).join("");
    const status = document.querySelector(`#${statusLabel}`);
    if (status) status.textContent = `${teams.length} equipos disponibles para esta competición.`;
    return teams;
  } catch {
    const status = document.querySelector(`#${statusLabel}`);
    if (status) status.textContent = "No se pudo cargar la lista de equipos.";
    return [];
  }
}

export async function teamAnalysisView(leagueA="PL",teamAName="",leagueB="PL",teamBName="") {
  const selectedA = teamAName ? {league:leagueA,name:teamAName} : null;
  const selectedB = teamBName ? {league:leagueB,name:teamBName} : null;
  const base = selector(selectedA, selectedB);
  if (!teamAName || !teamBName) return base;
  try {
    const [teamA, teamB] = await Promise.all([findTeam(leagueA, teamAName), findTeam(leagueB, teamBName)]);
    if (!teamA || !teamB) return base + `<div class="empty">No se pudo identificar uno de los equipos en la fuente histórica.</div>`;
    const rows = await getH2H(teamA, teamB);
    return base + `<div class="analysis-header-card card"><span class="badge live">Historial puro</span><div class="match-title"><h2>${esc(teamA.name)}</h2><div class="vs-big">VS</div><h2>${esc(teamB.name)}</h2></div><p class="muted">${esc(leagueName(leagueA))} · ${esc(leagueName(leagueB))}. Solo se muestran antecedentes históricos encontrados.</p></div>${summaryCard(rows)}${renderMatches(rows)}<div class="card analysis-note"><h3>Sobre los datos</h3><p class="muted">La cantidad de enfrentamientos, goles y tarjetas depende de lo que la fuente histórica tenga registrado. Los campos no disponibles permanecen como “Sin datos”; no se inventan ni se estiman.</p></div>`;
  } catch (error) {
    return base + `<div class="empty"><strong>No se pudo consultar el historial.</strong><br><span class="muted">${esc(error.message)}</span></div>`;
  }
}

function leagueName(code) { return LEAGUES.find(([v])=>v===code)?.[1] || code; }

export function bindTeamAnalysis() {
  const loadA = () => loadTeamsFor(document.querySelector("#analysisLeagueA")?.value || "PL", "teamsListA", "teamSearchStatus");
  const loadB = () => loadTeamsFor(document.querySelector("#analysisLeagueB")?.value || "PL", "teamsListB", "teamSearchStatus");
  loadA(); loadB();
  document.querySelector("#analysisLeagueA")?.addEventListener("change", loadA);
  document.querySelector("#analysisLeagueB")?.addEventListener("change", loadB);
}

export function getSelectedTeamSearch() {
  return {
    leagueA: document.querySelector("#analysisLeagueA")?.value || "PL",
    teamA: document.querySelector("#analysisSearchA")?.value?.trim() || "",
    leagueB: document.querySelector("#analysisLeagueB")?.value || "PL",
    teamB: document.querySelector("#analysisSearchB")?.value?.trim() || ""
  };
}
