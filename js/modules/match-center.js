import { getUpcomingFixtures } from '../services/football-api.js';

export const featuredLeagues = [
  { id:'premier-league', name:'Premier League', country:'Inglaterra', icon:'🇬🇧' },
  { id:'laliga', name:'LaLiga', country:'España', icon:'🇪🇸' },
  { id:'serie-a', name:'Serie A', country:'Italia', icon:'🇮🇹' },
  { id:'bundesliga', name:'Bundesliga', country:'Alemania', icon:'🇩🇪' },
  { id:'ligue-1', name:'Ligue 1', country:'Francia', icon:'🇫🇷' },
  { id:'champions-league', name:'Champions League', country:'Europa', icon:'⭐' },
  { id:'primeira-liga', name:'Primeira Liga', country:'Portugal', icon:'🇵🇹' }
];

export function currentSeasonLabel(date=new Date()){
  const y=date.getFullYear();
  const start=date.getMonth()>=6?y:y-1;
  return `${start}-${String(start+1).slice(-2)}`;
}

const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fixtureDate=(iso)=>new Intl.DateTimeFormat('es-BO',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));

export function renderLeagueTabs(active){
  return `<div class="league-tabs">${featuredLeagues.map(l=>`<button class="league-tab ${l.id===active?'active':''}" data-league="${l.id}"><span>${l.icon}</span><b>${l.name}</b><small>${l.country}</small></button>`).join('')}</div>`;
}

export async function renderMatchCenter(active='premier-league'){
  const season=currentSeasonLabel();
  const league=featuredLeagues.find(l=>l.id===active)||featuredLeagues[0];
  let fixtures=[];
  let error='';
  try{
    const data=await getUpcomingFixtures(league.id,season,30);
    fixtures=(data?.response||[]).filter(x=>new Date(x.fixture.date).getTime()>=Date.now()-3.6e6);
  }catch(e){error=e?.message||'No se pudieron cargar los partidos.';}

  const cards=fixtures.length?fixtures.map(f=>`
    <article class="fixture-card" data-fixture="${f.fixture.id}" data-league="${league.id}" data-home="${f.teams.home.id}" data-away="${f.teams.away.id}">
      <div class="fixture-top"><span>${esc(f.league.round||league.name)}</span><time>${fixtureDate(f.fixture.date)}</time></div>
      <div class="fixture-teams">
        <div class="club"><img src="${esc(f.teams.home.logo||'')}" alt=""><strong>${esc(f.teams.home.name)}</strong></div>
        <div class="fixture-vs"><b>VS</b><small>${esc(f.fixture.venue?.name||'Próximo partido')}</small></div>
        <div class="club"><img src="${esc(f.teams.away.logo||'')}" alt=""><strong>${esc(f.teams.away.name)}</strong></div>
      </div>
      <div class="fixture-action"><span>Ver análisis estadístico</span><b>→</b></div>
    </article>`).join(''):`<div class="empty-state"><div>⚽</div><h3>No hay próximos partidos disponibles</h3><p>${esc(error||'La fuente deportiva no devolvió fixtures próximos para esta competición.')}</p></div>`;

  return `
    <section class="hero-panel">
      <div><span class="kicker">CENTRO DE ANÁLISIS DEPORTIVO</span><h2>Partidos, tendencias y datos que sí importan.</h2><p>Selecciona una liga y abre cualquier encuentro para consultar forma reciente, goles, tarjetas y probabilidades estadísticas basadas en datos reales.</p></div>
      <div class="hero-stat"><strong>${fixtures.length}</strong><span>próximos partidos</span><small>${league.name} · ${season}</small></div>
    </section>
    <section class="section-block"><div class="section-heading"><div><span class="kicker">COMPETICIONES</span><h2>Ligas principales</h2></div><span class="data-pill"><i></i> Datos conectados</span></div>${renderLeagueTabs(league.id)}</section>
    <section class="section-block"><div class="section-heading"><div><span class="kicker">PRÓXIMOS ENCUENTROS</span><h2>${league.icon} ${league.name}</h2></div><button id="reloadMatches" class="ghost-btn">↻ Actualizar</button></div><div class="fixtures-grid">${cards}</div></section>`;
}
