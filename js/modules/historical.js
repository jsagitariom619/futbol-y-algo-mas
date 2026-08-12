import { getHistoricalMatches, getHistoricalTeams, historicalSeasons } from '../services/historical-api.js';

const leagues = [
  ['PL','Premier League'], ['ELC','Championship'], ['BL1','Bundesliga'], ['BL2','Bundesliga 2'],
  ['PD','LALIGA'], ['FL1','Ligue 1'], ['SA','Serie A'], ['PPL','Primeira Liga']
];
const names = Object.fromEntries(leagues);
const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function historicalView() {
  return `
    <div class="section-title"><div><h2>Historial de fútbol</h2><p class="muted">Partidos reales ya disputados y datos de temporadas anteriores.</p></div><span class="badge">8 competiciones</span></div>
    <div class="card">
      <div class="search-row" style="grid-template-columns:1fr 1fr auto">
        <select id="historyLeague">${leagues.map(([v,n]) => `<option value="${v}">${n}</option>`).join('')}</select>
        <select id="historySeason">${historicalSeasons.map(([v,n]) => `<option value="${v}">${n}</option>`).join('')}</select>
        <button id="historyLoad" class="primary-btn">Cargar historial</button>
      </div>
    </div>
    <div id="historyStatus" class="card"><span class="muted">Selecciona una competición y temporada.</span></div>
    <div id="historyTeams" class="grid"></div>
    <div id="historyMatches" class="card"></div>`;
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-BO', {day:'2-digit', month:'short', year:'numeric'});
}

function renderMatches(data) {
  const matches = data?.matches || [];
  if (!matches.length) return '<div class="empty">No hay partidos históricos disponibles para esta consulta.</div>';
  return `<div class="section-title"><h3>Partidos registrados</h3><span class="muted">${matches.length} resultados</span></div>
    <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Local</th><th>Resultado</th><th>Visitante</th><th>Estado</th></tr></thead><tbody>
    ${matches.map(match => `<tr><td>${fmtDate(match.utcDate)}</td><td>${esc(match.homeTeam?.name)}</td><td><strong>${match.score?.fullTime?.home ?? '—'} - ${match.score?.fullTime?.away ?? '—'}</strong></td><td>${esc(match.awayTeam?.name)}</td><td>${esc(match.status || 'FINISHED')}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function loadHistory() {
  const league = document.querySelector('#historyLeague')?.value;
  const season = document.querySelector('#historySeason')?.value;
  const status = document.querySelector('#historyStatus');
  const matchesEl = document.querySelector('#historyMatches');
  const teamsEl = document.querySelector('#historyTeams');
  if (!league || !season || !status || !matchesEl || !teamsEl) return;
  status.innerHTML = '<span class="muted">Consultando datos históricos reales…</span>';
  matchesEl.innerHTML = '';
  teamsEl.innerHTML = '';
  try {
    const [matchData, teamData] = await Promise.all([
      getHistoricalMatches(league, season),
      getHistoricalTeams(league, season)
    ]);
    const matches = matchData?.matches || [];
    const teams = teamData?.teams || [];
    status.innerHTML = `<div class="section-title"><div><h3>${names[league]}</h3><span class="muted">Temporada ${historicalSeasons.find(s => s[0] === season)?.[1] || season}</span></div><strong>${matches.length} partidos cargados</strong></div>`;
    teamsEl.innerHTML = teams.map(team => `<article class="card"><span class="badge">${esc(team.tla || team.shortName || 'Equipo')}</span><h3>${esc(team.name)}</h3><p class="muted">${esc(team.venue || 'Estadio no informado')}</p></article>`).join('');
    matchesEl.innerHTML = renderMatches(matchData);
  } catch (error) {
    status.innerHTML = `<div class="empty"><strong>No se pudo cargar el historial.</strong><br><span class="muted">${esc(error.message)}</span></div>`;
  }
}

export function bindHistorical() {
  document.querySelector('#historyLoad')?.addEventListener('click', loadHistory);
}
