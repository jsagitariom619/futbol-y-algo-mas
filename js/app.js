import { renderMatchCenter } from './modules/match-center.js';
import { renderStatisticalAnalysis } from './modules/statistical-analysis.js';
import {renderTeamsCompare,bindTeamsCompare,generateVersusAnalysis} from './modules/teams-compare.js';

const app=document.querySelector('#app');
const pageTitle=document.querySelector('#pageTitle');
const menu=document.querySelector('#sideMenu');
const backdrop=document.querySelector('#menuBackdrop');
const menuBtn=document.querySelector('#menuBtn');
let activeLeague='premier-league';
let lastMatchPayload=null;
let currentView='matches';

function loading(label='Cargando datos deportivos…'){app.innerHTML=`<div class="loading-screen"><div class="ball-loader">⚽</div><strong>${label}</strong><span>Preparando información</span></div>`;}
function setActiveNav(view){document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));}
function openMenu(){menu.classList.add('open');backdrop.hidden=false;requestAnimationFrame(()=>backdrop.classList.add('show'));document.body.classList.add('menu-open');menu.setAttribute('aria-hidden','false');menuBtn.setAttribute('aria-expanded','true');}
function closeMenu(){menu.classList.remove('open');backdrop.classList.remove('show');document.body.classList.remove('menu-open');menu.setAttribute('aria-hidden','true');menuBtn.setAttribute('aria-expanded','false');setTimeout(()=>{if(!backdrop.classList.contains('show'))backdrop.hidden=true;},220);}
function toggleMenu(){menu.classList.contains('open')?closeMenu():openMenu();}

async function showMatches(league=activeLeague){currentView='matches';activeLeague=league;pageTitle.textContent='Centro de partidos';setActiveNav('matches');loading('Cargando próximos partidos…');app.innerHTML=await renderMatchCenter(activeLeague);history.replaceState({view:'matches'},'',`#liga/${activeLeague}`);closeMenu();}
async function showTeams(){currentView='teams';pageTitle.textContent='Equipos / Versus';setActiveNav('teams');loading('Abriendo equipos precargados…');app.innerHTML=await renderTeamsCompare();await bindTeamsCompare();history.replaceState({view:'teams'},'','#equipos');closeMenu();}
async function showAnalysis(card){const fixture=card.dataset.fixture;lastMatchPayload={fixtureId:fixture,league:card.dataset.league,homeId:card.dataset.home,awayId:card.dataset.away,homeName:card.querySelector('.club:first-child strong')?.textContent||'Local',awayName:card.querySelector('.club:last-child strong')?.textContent||'Visitante',homeLogo:card.querySelector('.club:first-child img')?.src||'',awayLogo:card.querySelector('.club:last-child img')?.src||'',date:card.querySelector('time')?.dataset.iso||''};pageTitle.textContent='Análisis del partido';loading('Analizando historial precargado…');app.innerHTML=await renderStatisticalAnalysis(lastMatchPayload);history.pushState({view:'analysis'},'',`#partido/${fixture}`);window.scrollTo({top:0,behavior:'smooth'});closeMenu();}

app.addEventListener('click',async e=>{const league=e.target.closest('[data-league].league-tab');if(league){await showMatches(league.dataset.league);return;}const fixture=e.target.closest('.fixture-card');if(fixture){await showAnalysis(fixture);return;}if(e.target.closest('#reloadMatches')){try{for(const k of Object.keys(localStorage))if(k.startsWith('fa-api:fixtures:'))localStorage.removeItem(k);}catch{}await showMatches(activeLeague);return;}if(e.target.closest('[data-back]')){await showMatches(activeLeague);return;}if(e.target.closest('#generateAnalysis')){await generateVersusAnalysis();return;}});

document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>b.dataset.nav==='teams'?showTeams():showMatches(activeLeague)));
menuBtn?.addEventListener('click',toggleMenu);backdrop?.addEventListener('click',closeMenu);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.querySelector('#homeBtn')?.addEventListener('click',()=>showMatches(activeLeague));document.querySelector('#refreshBtn')?.addEventListener('click',()=>currentView==='teams'?showTeams():showMatches(activeLeague));
window.addEventListener('popstate',()=>{if(location.hash==='#equipos')showTeams();else if(location.hash.startsWith('#liga/'))showMatches(location.hash.split('/')[1]||activeLeague);else if(lastMatchPayload&&location.hash.startsWith('#partido/')){pageTitle.textContent='Análisis del partido';loading();renderStatisticalAnalysis(lastMatchPayload).then(html=>app.innerHTML=html);}else showMatches(activeLeague);});

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(location.hash==='#equipos')showTeams();else showMatches(location.hash.startsWith('#liga/')?location.hash.split('/')[1]:'premier-league');
