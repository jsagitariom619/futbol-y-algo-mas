import { getTeamStats, getTeamMatches, getHeadToHead } from '../services/football-api.js';

const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const num=n=>Number.isFinite(Number(n))?Number(n):0;
function avgRecent(fixtures,teamId){const xs=(fixtures||[]).slice(0,6);if(!xs.length)return {gf:0,ga:0,form:[],sample:0,points:0};let gf=0,ga=0,points=0;const form=[];for(const m of xs){const home=m.teams.home.id===Number(teamId);const f=home?num(m.goals.home):num(m.goals.away);const g=home?num(m.goals.away):num(m.goals.home);gf+=f;ga+=g;if(f>g){form.push('G');points+=3;}else if(f===g){form.push('E');points+=1;}else form.push('P');}return {gf:gf/xs.length,ga:ga/xs.length,form,sample:xs.length,points};}
function seasonAverage(stats,pathA,pathB){const a=stats?.goals?.[pathA]?.average?.[pathB];return num(a)||num(stats?.goals?.[pathA]?.average?.total);}
function cardAverage(stats,type){const cards=stats?.cards?.[type]||{};let total=0;for(const v of Object.values(cards))total+=num(v?.total);const played=num(stats?.fixtures?.played?.total)||1;return total/played;}
function formHtml(form){return `<div class="form-strip">${(form.length?form:['—']).map(x=>`<span class="${x==='G'?'win':x==='E'?'draw':x==='P'?'loss':''}">${x}</span>`).join('')}</div>`;}
function statCard(label,value,sub=''){return `<article class="summary-card"><span>${label}</span><strong>${value}</strong>${sub?`<small>${sub}</small>`:''}</article>`;}

export async function renderStatisticalAnalysis({league,homeId,awayId,homeName,awayName,homeLogo='',awayLogo='',date=''}){
  const y=new Date().getMonth()>=6?new Date().getFullYear():new Date().getFullYear()-1;
  const season=`${y}-${String(y+1).slice(-2)}`;
  try{
    const [homeStats,awayStats,homeRecentData,awayRecentData,h2hData]=await Promise.all([
      getTeamStats(homeId,league,season),getTeamStats(awayId,league,season),getTeamMatches(homeId,league,season,6),getTeamMatches(awayId,league,season,6),getHeadToHead(homeId,awayId,6)
    ]);
    const hs=homeStats?.response||{},as=awayStats?.response||{};
    const hr=avgRecent(homeRecentData?.response,homeId),ar=avgRecent(awayRecentData?.response,awayId);
    const hGF=seasonAverage(hs,'for','home'),hGA=seasonAverage(hs,'against','home');
    const aGF=seasonAverage(as,'for','away'),aGA=seasonAverage(as,'against','away');
    const hYellow=cardAverage(hs,'yellow'),aYellow=cardAverage(as,'yellow');
    const hRed=cardAverage(hs,'red'),aRed=cardAverage(as,'red');
    const h2h=(h2hData?.response||[]).slice(0,6);let hh=0,hd=0,ha=0,hg=0;
    for(const m of h2h){const homeIs=m.teams.home.id===Number(homeId);const a=homeIs?num(m.goals.home):num(m.goals.away);const b=homeIs?num(m.goals.away):num(m.goals.home);hg+=a+b;if(a>b)hh++;else if(a===b)hd++;else ha++;}
    const dateText=date?new Intl.DateTimeFormat('es-BO',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(date)):'';
    const recentCombined=hr.sample&&ar.sample?((hr.gf+hr.ga+ar.gf+ar.ga)/2).toFixed(1):'—';
    const strongerForm=hr.points===ar.points?'Forma reciente equilibrada':hr.points>ar.points?`${homeName} llega con mejor forma reciente`:`${awayName} llega con mejor forma reciente`;

    return `<section class="analysis-page">
      <button class="back-btn" data-back>← Volver a partidos</button>
      <article class="analysis-hero"><span class="kicker">ANÁLISIS ESTADÍSTICO · ${esc(season)}</span><div class="analysis-clubs"><div><img src="${esc(homeLogo)}" alt=""><h2>${esc(homeName)}</h2></div><div class="analysis-vs"><strong>VS</strong><small>${esc(dateText)}</small></div><div><img src="${esc(awayLogo)}" alt=""><h2>${esc(awayName)}</h2></div></div><p>Resumen descriptivo basado en rendimiento de temporada, últimos partidos y enfrentamientos directos. No intenta predecir el resultado del encuentro.</p></article>

      <div class="analysis-summary-grid">
        ${statCard(`Goles ${homeName} como local`,hGF?hGF.toFixed(1):'—','promedio de temporada')}
        ${statCard(`Goles ${awayName} como visitante`,aGF?aGF.toFixed(1):'—','promedio de temporada')}
        ${statCard('Goles observados en forma reciente',recentCombined,'promedio combinado')}
        <article class="summary-card featured"><span>Lectura de forma</span><strong style="font-size:18px">${esc(strongerForm)}</strong><small>últimos ${Math.max(hr.sample,ar.sample)} partidos disponibles</small></article>
      </div>

      <div class="analysis-detail-grid">
        <article class="insight-card"><div class="insight-title"><span>⚽</span><div><small>RENDIMIENTO</small><h3>Goles</h3></div></div><div class="split-stat"><div><span>${esc(homeName)} · anota</span><b>${hGF?hGF.toFixed(1):'—'}</b></div><div><span>${esc(homeName)} · recibe</span><b>${hGA?hGA.toFixed(1):'—'}</b></div><div><span>${esc(awayName)} · anota</span><b>${aGF?aGF.toFixed(1):'—'}</b></div><div><span>${esc(awayName)} · recibe</span><b>${aGA?aGA.toFixed(1):'—'}</b></div></div></article>

        <article class="insight-card"><div class="insight-title"><span>🟨</span><div><small>DISCIPLINA</small><h3>Tarjetas por partido</h3></div></div><div class="split-stat"><div><span>${esc(homeName)} amarillas</span><b>${hYellow.toFixed(1)}</b></div><div><span>${esc(awayName)} amarillas</span><b>${aYellow.toFixed(1)}</b></div><div><span>${esc(homeName)} rojas</span><b>${hRed.toFixed(2)}</b></div><div><span>${esc(awayName)} rojas</span><b>${aRed.toFixed(2)}</b></div></div></article>

        <article class="insight-card"><div class="insight-title"><span>📈</span><div><small>ÚLTIMOS PARTIDOS</small><h3>Forma reciente</h3></div></div><div class="team-form"><div><span>${esc(homeName)}</span>${formHtml(hr.form)}<small>${hr.sample?`${hr.gf.toFixed(1)} GF · ${hr.ga.toFixed(1)} GC por partido`:'Sin muestra reciente'}</small></div><div><span>${esc(awayName)}</span>${formHtml(ar.form)}<small>${ar.sample?`${ar.gf.toFixed(1)} GF · ${ar.ga.toFixed(1)} GC por partido`:'Sin muestra reciente'}</small></div></div></article>

        <article class="insight-card"><div class="insight-title"><span>⚔️</span><div><small>CARA A CARA</small><h3>Enfrentamientos directos</h3></div></div>${h2h.length?`<div class="h2h-score"><div><strong>${hh}</strong><span>triunfos ${esc(homeName)}</span></div><div><strong>${hd}</strong><span>empates</span></div><div><strong>${ha}</strong><span>triunfos ${esc(awayName)}</span></div></div><div class="h2h-average"><span>Promedio de goles en ${h2h.length} duelos</span><b>${(hg/h2h.length).toFixed(1)}</b></div>`:`<div class="empty-inline">No hay suficientes enfrentamientos directos disponibles.</div>`}</article>
      </div>

      <article class="method-card"><div><span>ℹ️</span><div><h3>Qué estás viendo</h3><p>Los promedios proceden de los registros disponibles para la temporada y de los últimos encuentros de cada equipo. Si la fuente no dispone de una estadística, se muestra sin dato en lugar de inventarla.</p></div></div><small>Fuente deportiva: API-Football. Los datos pueden actualizarse conforme avanza la competición.</small></article>
    </section>`;
  }catch(e){return `<section class="analysis-page"><button class="back-btn" data-back>← Volver a partidos</button><div class="empty-state"><div>📊</div><h3>No se pudo completar el análisis</h3><p>${esc(e?.message||'La fuente estadística no respondió.')}</p></div></section>`;}
}
