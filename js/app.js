import {dashboard} from "./modules/dashboard.js";
import {competitionsView} from "./modules/competitions.js";
import {teamsView,bindTeamSearch} from "./modules/teams.js";
import {showToast} from "./ui/ui.js";
import {teamAnalysisView} from "./modules/team-analysis.js";
import {historicalView,bindHistorical} from "./modules/historical.js";

const views = {
  dashboard:["Visor histórico",dashboard],
  historical:["Historial de fútbol",historicalView],
  competitions:["Competiciones históricas",competitionsView],
  teams:["Equipos",teamsView],
  teamAnalysis:["Comparar historial",teamAnalysisView]
};

const app=document.querySelector("#app");
const title=document.querySelector("#pageTitle");
const sidebar=document.querySelector(".sidebar");

function parseHash(){
  const raw=location.hash.slice(1)||"dashboard";
  const [view,...rest]=raw.split("/");
  return {view,param:rest.join("/")};
}

async function render(view="dashboard",param=""){
  const v=views[view]||views.dashboard;
  title.textContent=v[0];
  const parts=param?param.split("/"):[];
  const rendered = view==="teamAnalysis"
    ? v[1](parts[0]||"premier-league",parts[1]||"",parts[2]||"")
    : view==="historical"
      ? v[1](parts[0]||"PL",parts[1]||"2025")
      : v[1]();
  app.innerHTML = await Promise.resolve(rendered);

  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="teams") bindTeamSearch();
  if(view==="historical") bindHistorical();
  sidebar.classList.remove("open");
}

document.querySelector("#nav").addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");
  if(b) location.hash=b.dataset.view;
});

document.querySelector("#menuBtn").onclick=()=>sidebar.classList.toggle("open");
document.querySelector("#refreshBtn").onclick=()=>showToast("Vista actualizada. Los datos mostrados corresponden al historial disponible en las fuentes configuradas.");

app.addEventListener("click",e=>{
  const comp=e.target.closest(".historical-open");
  if(comp){ location.hash=`historical/${comp.dataset.competition}/2025`; return; }
  if(e.target.id==="runTeamAnalysis") {
    const c=document.querySelector("#analysisCompetition")?.value;
    const h=document.querySelector("#analysisHome")?.value;
    const a=document.querySelector("#analysisAway")?.value;
    if(c&&h&&a&&h!==a) location.hash=`teamAnalysis/${c}/${h}/${a}`;
  }
});

app.addEventListener("change",e=>{
  if(e.target.id==="analysisCompetition") location.hash="teamAnalysis/"+e.target.value;
});

window.addEventListener("hashchange",()=>{
  const x=parseHash();
  render(x.view,x.param);
});

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

const first=parseHash();
render(first.view,first.param);
