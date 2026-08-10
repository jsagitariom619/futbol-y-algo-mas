import {matches} from "../data/matches.js";
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {analysisForMatch,metric} from "../services/analysis.js";
const fmt=d=>new Date(d).toLocaleString("es-BO",{dateStyle:"full",timeStyle:"short"});
export function matchDetail(id){
 const m=matches.find(x=>x.id===id); if(!m)return `<div class="empty">Partido no encontrado.</div>`;
 const c=competitions.find(x=>x.id===m.competitionId); const a=analysisForMatch(m.home,m.away,teams);
 const stat=(label,h,a)=>`<div class="stat-row"><span>${label}</span><b>${metric(h)}</b><i>vs</i><b>${metric(a)}</b></div>`;
 const available=(a.home?.played||0)+(a.away?.played||0)>0;
 return `<div class="back-link" data-back="matches">← Volver a fixtures</div><div class="match-hero card"><span class="badge live">${c?.name||m.competitionId}</span><div class="match-title"><h2>${m.home}</h2><div class="vs-big">VS</div><h2>${m.away}</h2></div><p class="muted">${fmt(m.date)} · ${m.round}</p></div>
 <div class="section-title"><div><h2>Análisis estadístico</h2><p class="muted">Solo se muestran indicadores respaldados por datos disponibles.</p></div></div>
 <div class="analysis-grid">
 <div class="card"><h3>⚽ Goles</h3>${stat('Goles a favor',a.home?.goalsFor,a.away?.goalsFor)}${stat('Goles recibidos',a.home?.goalsAgainst,a.away?.goalsAgainst)}${stat('Promedio conjunto',a.combined.goalsFor,null)}</div>
 <div class="card"><h3>🚩 Córners</h3>${stat('Córners a favor',a.home?.cornersFor,a.away?.cornersFor)}${stat('Córners concedidos',a.home?.cornersAgainst,a.away?.cornersAgainst)}${stat('Promedio conjunto',a.combined.cornersFor,null)}</div>
 <div class="card"><h3>🟨 Tarjetas</h3>${stat('Amarillas',a.home?.yellowCards,a.away?.yellowCards)}${available?'<p class="muted">Las cifras se actualizarán cuando exista histórico verificable.</p>':'<p class="muted">Todavía no hay histórico estadístico de esta temporada cargado.</p>'}</div>
 <div class="card"><h3>📈 Tendencias</h3><div class="trend-empty"><strong>Datos insuficientes</strong><span>La plataforma no inventará porcentajes ni estadísticas. Al sincronizar resultados históricos, aquí aparecerán frecuencias y promedios calculados automáticamente.</span></div></div>
 </div>`;
}
