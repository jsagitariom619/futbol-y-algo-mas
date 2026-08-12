import {getHistoricalMatches,getHistoricalTeams,historicalCompetitions} from '../services/historical-api.js';
import {esc} from '../ui/ui.js';

const leagues=[['PL','Premier League'],['ELC','Championship'],['BL1','Bundesliga'],['BL2','Bundesliga 2'],['PD','LALIGA'],['FL1','Ligue 1'],['SA','Serie A'],['PPL','Primeira Liga']];
const seasons=[['2025','2025/26'],['2024','2024/25'],['2023','2023/24']];
const names=Object.fromEntries(leagues);

export function historicalView(){return `
  <div class="section-title"><div><h2>Historial de fútbol</h2><p class="muted">Resultados y estadísticas de temporadas ya disputadas.</p></div><span class="badge">8 competiciones</span></div>
  <div class="card">
    <div class="search-row" style="grid-template-columns:1fr 1fr auto">
      <select id="historyLeague">${leagues.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select>
      <select id="historySeason">${seasons.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select>
      <button id="historyLoad" class="primary-btn">Cargar historial</button>
    </div>
  </div>
  <div id="historyStatus" class="card"><span class="muted">Selecciona una competición y temporada para consultar partidos finalizados.</span></div>
  <div id="historyTeams" class="grid"></div>
  <div id="historyMatches" class="card"></div>`}

function fmtDate(v){try{return new Date(v).toLocaleDateString('es-BO',{day:'2-digit',month:'short',year:'numeric'});}catch{return '—';}}
function matchRows(data){
  const rows=data?.matches||[];
  if(!rows.length)return '<div class="empty">No hay partidos históricos disponibles para esta consulta.</div>';
  return `<div class="section-title"><h3>Partidos registrados</h3><span class="muted">${rows.length} resultados</span></div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Local</th><th>Resultado</th><th>Visitante</th><th>Estado</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${fmtDate(m.utcDate)}</td><td>${esc(m.homeTeam?.name||'—')}</td><td><strong>${m.score?.fullTime?.home ?? '—'} - ${m.score?.fullTime?.away ?? '—'}</strong></td><td>${esc(m.awayTeam?.name||'—')}</td><td>${esc(m.status||'FINISHED')}</td></tr>`).join('')}</tbody></table></div>`;
}

async function loadHistory(){
  const league=document.querySelector('#historyLeague')?.value;
  const season=document.querySelector('#historySeason')?.value;
  const status=document.querySelector('#historyStatus');
  const matches=document.querySelector('#historyMatches');
  const teams=document.querySelector('#historyTeams');
  if(!league||!season||!status||!matches)return;
  status.innerHTML='<span class="muted">Consultando datos históricos…</span>';
  matches.innerHTML=''; teams.innerHTML='';
  try{
    const [data,teamData]=await Promise.all([getHistoricalMatches(league,season),getHistoricalTeams(league,season)]);
    const count=data?.matches?.length||0;
    status.innerHTML=`<div class="section-title"><div><h3>${names[league]}</h3><span class="muted">Temporada ${seasons.find(x=>x[0]===season)?.[1]||season}</span></div><strong>${count} partidos cargados</strong></div>`;
    teams.innerHTML=(teamData?.teams||[]).map(t=>`<article class="card"><span class="badge">${esc(t.shortName||t.tla||'Equipo')}</span><h3>${esc(t.name||'—')}</h3><p class="muted">${esc(t.venue||'Estadio no informado')}</p></article>`).join('');
    matches.innerHTML=matchRows(data);
  }catch(error){
    status.innerHTML=`<div class="empty"><strong>No se pudo cargar el historial.</strong><br><span class="muted">${esc(error.message||'Error de conexión')}</span></div>`;
  }
}

export function bindHistorical(){document.querySelector('#historyLoad')?.addEventListener('click',loadHistory);}
