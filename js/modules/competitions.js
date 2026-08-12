import {competitions} from "../data/competitions.js";
import {esc} from "../ui/ui.js";

export function competitionsView(){
 return `<div class="section-title"><div><h2>Archivo de competiciones</h2><span class="muted">Temporadas, partidos finalizados y estadísticas históricas por liga.</span></div></div>
 <div class="grid">${competitions.map(c=>`<article class="card competition-card historical-open" data-competition="${c.id}"><span class="badge">Archivo histórico</span><div class="comp-icon">⚽</div><h3>${esc(c.name)}</h3><p class="muted">${esc(c.country)} · ${c.tier==='2'?'Segunda división':'Primera división'}</p><div class="competition-meta"><span>2023/24</span><span>2024/25</span><span>2025/26</span></div><div class="match-action">Explorar temporadas →</div></article>`).join("")}</div>`;
}
