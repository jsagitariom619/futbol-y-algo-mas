
import {dashboard} from "./modules/dashboard.js";
import {competitionsView} from "./modules/competitions.js";
import {matchesView} from "./modules/matches.js";
import {teamsView,bindTeamSearch} from "./modules/teams.js";
import {standingsView} from "./modules/standings.js";
import {matchDetail} from "./modules/match-detail.js";
import {showToast} from "./ui/ui.js";
import {teamAnalysisView} from "./modules/team-analysis.js";

const views = {
  dashboard:["Resumen",dashboard],
  competitions:["Competiciones",competitionsView],
  matches:["Fixtures",matchesView],
  teams:["Equipos",teamsView],
  standings:["Clasificaciones",standingsView],
  analysis:["Análisis del partido",matchDetail],
  teamAnalysis:["Analizar equipos",teamAnalysisView]
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
  const rendered = view==="matches" ? v[1](param||"all") :
    view==="standings" ? v[1](param||"premier-league") :
    view==="analysis" ? v[1](param) :
    view==="teamAnalysis" ? v[1](parts[0]||"premier-league",parts[1]||"",parts[2]||"") :
    v[1]();
  app.innerHTML = await Promise.resolve(rendered);

  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="teams") bindTeamSearch();
  sidebar.classList.remove("open");
}

document.querySelector("#nav").addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");
  if(b) location.hash=b.dataset.view;
});

document.querySelector("#menuBtn").onclick=()=>sidebar.classList.toggle("open");
document.querySelector("#refreshBtn").onclick=()=>showToast("Actualización preparada; no se muestran datos inventados.");

app.addEventListener("click",e=>{
  const comp=e.target.closest(".comp-open");
  if(comp){ location.hash="matches/"+comp.dataset.competition; return; }

  const match=e.target.closest(".match-open");
  if(match){ location.hash="analysis/"+match.dataset.matchId; return; }

  const back=e.target.closest(".back-to-matches,.back-link");
  if(back){ location.hash="matches"; return; }
  if(e.target.id==="runTeamAnalysis") {
    const c=document.querySelector("#analysisCompetition")?.value;
    const h=document.querySelector("#analysisHome")?.value;
    const a=document.querySelector("#analysisAway")?.value;
    if(c&&h&&a&&h!==a) location.hash=`teamAnalysis/${c}/${h}/${a}`;
    return;
  }
});

app.addEventListener("change",e=>{
  if(e.target.id==="matchCompetition") location.hash="matches/"+e.target.value;
  if(e.target.id==="standingCompetition") location.hash="standings/"+e.target.value;
  if(e.target.id==="analysisCompetition") location.hash="teamAnalysis/"+e.target.value;
});

window.addEventListener("hashchange",()=>{
  const x=parseHash();
  render(x.view,x.param);
});

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

const first=parseHash();
render(first.view,first.param);
