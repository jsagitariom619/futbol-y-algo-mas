import { renderMatchCenter } from './modules/match-center.js';
import { renderStatisticalAnalysis } from './modules/statistical-analysis.js';

const app=document.querySelector('#app');
const pageTitle=document.querySelector('#pageTitle');
let activeLeague='premier-league';
let lastMatchPayload=null;

function loading(label='Cargando datos deportivos…'){
  app.innerHTML=`<div class="loading-screen"><div class="ball-loader">⚽</div><strong>${label}</strong><span>Consultando la fuente estadística</span></div>`;
}
async function showMatches(league=activeLeague){
  activeLeague=league;
  pageTitle.textContent='Centro de partidos';
  loading('Cargando próximos partidos…');
  app.innerHTML=await renderMatchCenter(activeLeague);
  history.replaceState({view:'matches'},'',`#liga/${activeLeague}`);
}
async function showAnalysis(card){
  const fixture=card.dataset.fixture;
  lastMatchPayload={
    fixtureId:fixture,
    league:card.dataset.league,
    homeId:card.dataset.home,
    awayId:card.dataset.away,
    homeName:card.querySelector('.club:first-child strong')?.textContent||'Local',
    awayName:card.querySelector('.club:last-child strong')?.textContent||'Visitante',
    homeLogo:card.querySelector('.club:first-child img')?.src||'',
    awayLogo:card.querySelector('.club:last-child img')?.src||'',
    date:card.querySelector('time')?.dataset.iso||''
  };
  pageTitle.textContent='Análisis del partido';
  loading('Construyendo análisis estadístico…');
  app.innerHTML=await renderStatisticalAnalysis(lastMatchPayload);
  history.pushState({view:'analysis'},'',`#partido/${fixture}`);
  window.scrollTo({top:0,behavior:'smooth'});
}

app.addEventListener('click',async e=>{
  const league=e.target.closest('[data-league].league-tab');
  if(league){await showMatches(league.dataset.league);return;}
  const fixture=e.target.closest('.fixture-card');
  if(fixture){await showAnalysis(fixture);return;}
  if(e.target.closest('#reloadMatches')){try{for(const k of Object.keys(localStorage))if(k.startsWith('fa-api:fixtures:'))localStorage.removeItem(k);}catch{}await showMatches(activeLeague);return;}
  if(e.target.closest('[data-back]')){await showMatches(activeLeague);return;}
});

document.querySelector('#homeBtn')?.addEventListener('click',()=>showMatches(activeLeague));
document.querySelector('#refreshBtn')?.addEventListener('click',()=>showMatches(activeLeague));
window.addEventListener('popstate',()=>{if(location.hash.startsWith('#liga/'))showMatches(location.hash.split('/')[1]||activeLeague);else if(lastMatchPayload&&location.hash.startsWith('#partido/')){pageTitle.textContent='Análisis del partido';loading();renderStatisticalAnalysis(lastMatchPayload).then(html=>app.innerHTML=html);}else showMatches(activeLeague);});

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const initialLeague=location.hash.startsWith('#liga/')?location.hash.split('/')[1]:'premier-league';
showMatches(initialLeague);
