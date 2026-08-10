
import {competitions} from "../data/competitions.js";
import {teams} from "../data/teams.js";
import {matches} from "../data/matches.js";
export function dashboard(){
 const active=competitions.filter(c=>c.status==="active").length;
 return `<div class="hero">
  <div class="card hero-card"><span class="badge live">● Temporada 2026/27</span><h2>Todo el fútbol, organizado en un solo lugar.</h2><p class="muted">Consulta competiciones, partidos, equipos, clasificaciones y estadísticas con una interfaz pensada primero para móvil.</p>
   <div class="metric-grid"><div class="metric"><small>Competiciones</small><b>${active}</b></div><div class="metric"><small>Clubes cargados</small><b>${teams.length}</b></div><div class="metric"><small>Partidos demo</small><b>${matches.length}</b></div><div class="metric"><small>Modo</small><b>Offline</b></div></div>
  </div>
  <div class="card"><h3>Actualización de datos</h3><p class="muted">La arquitectura separa datos, interfaz y servicios. Así podemos actualizar una competición sin tocar el resto de la aplicación.</p><span class="badge">Datos locales</span></div>
 </div>
 <div class="section-title"><h2>Competiciones destacadas</h2><span class="muted">2026/27</span></div>
 <div class="grid">${competitions.slice(0,8).map(c=>`<article class="card competition-card"><div class="comp-icon">⚽</div><h3>${c.name}</h3><p class="muted">${c.country} · ${c.season}</p><span class="badge">${c.status==="historical"?"Histórica":"Activa"}</span></article>`).join("")}</div>`;
}
