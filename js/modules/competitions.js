
import {competitions} from "../data/competitions.js";
export function competitionsView(){
 return `<div class="section-title"><h2>Competiciones</h2><span class="muted">${competitions.length} registradas</span></div>
 <div class="grid">${competitions.map(c=>`<article class="card competition-card"><span class="badge ${c.status==="active"?"live":""}">${c.status==="historical"?"Histórica":"Activa"}</span><h3>${c.name}</h3><p class="muted">${c.country} · ${c.season}</p><p class="muted">Fuente de clubes: ${c.source?"verificada":"pendiente de conexión de datos"}</p></article>`).join("")}</div>`;
}
