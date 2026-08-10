
import {teams} from "../data/teams.js";
export function teamsView(){
 return `<div class="section-title"><h2>Equipos</h2><span class="muted">${teams.length} clubes con ficha base</span></div>
 <div class="search-row"><input id="teamSearch" placeholder="Buscar equipo..."></div>
 <div id="teamGrid" class="grid">${cards(teams)}</div>`;
}
function cards(arr){return arr.map(t=>`<article class="card team-card"><span class="badge">${t.competitionId}</span><h3>${t.name}</h3><p class="muted">${t.season}</p><div class="metric-grid" style="grid-template-columns:repeat(2,1fr)"><div class="metric"><small>Partidos</small><b>${t.stats.played}</b></div><div class="metric"><small>Goles</small><b>${t.stats.goalsFor}</b></div></div></article>`).join("")||`<div class="empty">No encontramos equipos.</div>`}
export function bindTeamSearch(){const i=document.querySelector("#teamSearch");const g=document.querySelector("#teamGrid");if(!i||!g)return;i.oninput=()=>{const q=i.value.toLowerCase();g.innerHTML=cards(teams.filter(t=>t.name.toLowerCase().includes(q)))}} 
