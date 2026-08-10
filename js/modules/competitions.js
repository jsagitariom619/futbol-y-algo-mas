import {competitions} from "../data/competitions.js";
export function competitionsView(){
 return `<div class="section-title"><div><h2>Competiciones</h2><p class="muted">Selecciona una competición para ver su calendario, clasificación y equipos.</p></div><span class="muted">${competitions.length} registradas</span></div>
 <div class="grid">${competitions.map(c=>`<button class="card competition-card interactive-card" data-open-competition="${c.id}"><div class="card-top"><span class="badge ${c.status==='active'?'live':''}">${c.status==='historical'?'Histórica':'Activa'}</span><span class="arrow">→</span></div><h3>${c.name}</h3><p class="muted">${c.country} · ${c.season}</p><p class="muted">${c.status==='historical'?'Archivo histórico':'Ver fixtures, clasificación y equipos'}</p></button>`).join("")}</div>`;
}
