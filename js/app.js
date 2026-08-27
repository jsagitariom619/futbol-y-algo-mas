import {renderTeamsCompare,bindTeamsCompare,generateVersusAnalysis} from './modules/teams-compare.js';
const app=document.querySelector('#app'),pageTitle=document.querySelector('#pageTitle'),menu=document.querySelector('#sideMenu'),backdrop=document.querySelector('#menuBackdrop'),menuBtn=document.querySelector('#menuBtn');
function openMenu(){menu.classList.add('open');backdrop.hidden=false;requestAnimationFrame(()=>backdrop.classList.add('show'));document.body.classList.add('menu-open');menu.setAttribute('aria-hidden','false');menuBtn.setAttribute('aria-expanded','true');}
function closeMenu(){menu.classList.remove('open');backdrop.classList.remove('show');document.body.classList.remove('menu-open');menu.setAttribute('aria-hidden','true');menuBtn.setAttribute('aria-expanded','false');setTimeout(()=>{if(!backdrop.classList.contains('show'))backdrop.hidden=true;},220);}
async function showGenerator(){pageTitle.textContent='Generador estadístico';app.innerHTML='<div class="loading-screen"><div class="ball-loader">⚽</div><strong>Abriendo base histórica local…</strong></div>';app.innerHTML=await renderTeamsCompare();await bindTeamsCompare();history.replaceState({view:'generator'},'','#generador');closeMenu();}
app.addEventListener('click',async e=>{if(e.target.closest('#generateAnalysis'))await generateVersusAnalysis();});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',showGenerator));
menuBtn?.addEventListener('click',()=>menu.classList.contains('open')?closeMenu():openMenu());backdrop?.addEventListener('click',closeMenu);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.querySelector('#homeBtn')?.addEventListener('click',showGenerator);document.querySelector('#refreshBtn')?.addEventListener('click',showGenerator);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
showGenerator();
