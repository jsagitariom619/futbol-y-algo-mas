
import {dashboard} from "./modules/dashboard.js";
import {competitionsView} from "./modules/competitions.js";
import {matchesView} from "./modules/matches.js";
import {teamsView,bindTeamSearch} from "./modules/teams.js";
import {standingsView} from "./modules/standings.js";
import {showToast} from "./ui/ui.js";

const views={dashboard:["Resumen",dashboard],competitions:["Competiciones",competitionsView],matches:["Partidos",matchesView],teams:["Equipos",teamsView],standings:["Clasificaciones",standingsView]};
const app=document.querySelector("#app"), title=document.querySelector("#pageTitle"), sidebar=document.querySelector(".sidebar");

function render(id="dashboard"){
 const [t,fn]=views[id]||views.dashboard; title.textContent=t; app.innerHTML=fn();
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
 if(id==="teams")bindTeamSearch();
 sidebar.classList.remove("open");
 history.replaceState(null,"","#"+id);
}
document.querySelector("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)render(b.dataset.view)});
document.querySelector("#menuBtn").onclick=()=>sidebar.classList.toggle("open");
document.querySelector("#refreshBtn").onclick=()=>showToast("Estructura lista para sincronizar datos");
window.addEventListener("hashchange",()=>render(location.hash.slice(1)));
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render(location.hash.slice(1)||"dashboard");
