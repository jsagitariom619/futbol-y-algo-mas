import {dashboard} from "./modules/dashboard.js";
import {competitionsView} from "./modules/competitions.js";
import {matchesView,bindMatchFilters} from "./modules/matches.js";
import {teamsView,bindTeamSearch} from "./modules/teams.js";
import {standingsView,bindStandings} from "./modules/standings.js";
import {matchDetail} from "./modules/match-detail.js";
import {showToast} from "./ui/ui.js";
const views={dashboard:["Resumen",dashboard],competitions:["Competiciones",competitionsView],matches:["Fixtures",matchesView],teams:["Equipos",teamsView],standings:["Clasificaciones",standingsView],match:["Análisis del partido",matchDetail]};
const app=document.querySelector('#app'),title=document.querySelector('#pageTitle'),sidebar=document.querySelector('.sidebar');
function render(id='dashboard',arg=''){const v=views[id]||views.dashboard;title.textContent=v[0];app.innerHTML=id==='match'?v[1](arg):v[1](arg);document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));sidebar.classList.remove('open');bind();}
function bind(){
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view));
 document.querySelectorAll('[data-open-competition]').forEach(b=>b.onclick=()=>render('matches',b.dataset.openCompetition));
 document.querySelectorAll('[data-open-match]').forEach(b=>b.onclick=()=>render('match',b.dataset.openMatch));
 document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>render(b.dataset.back));
 bindTeamSearch();bindStandings(render);bindMatchFilters(render);
}
document.querySelector('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)render(b.dataset.view)});
document.querySelector('#menuBtn').onclick=()=>sidebar.classList.toggle('open');
document.querySelector('#refreshBtn').onclick=()=>showToast('La interfaz está lista para sincronizar datos oficiales.');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render(location.hash.slice(1)||'dashboard');
