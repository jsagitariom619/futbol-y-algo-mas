import { getTeamStats, getTeamMatches, getHeadToHead } from '../services/football-api.js';

const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const pct=n=>`${Math.round(n*100)}%`;
const num=n=>Number.isFinite(Number(n))?Number(n):0;
const poisson=(k,l)=>Math.exp(-l)*(l**k)/factorial(k);
function factorial(n){let x=1;for(let i=2;i<=n;i++)x*=i;return x;}
function poissonAtLeast(k,l){let under=0;for(let i=0;i<k;i++)under+=poisson(i,l);return clamp(1-under,0,1);}
function scoreProbabilities(homeLambda,awayLambda){let h=0,d=0,a=0;for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const p=poisson(i,homeLambda)*poisson(j,awayLambda);if(i>j)h+=p;else if(i===j)d+=p;else a+=p;}const t=h+d+a||1;return {home:h/t,draw:d/t,away:a/t};}
function avgRecent(fixtures,teamId){const xs=(fixtures||[]).slice(0,6);if(!xs.length)return {gf:0,ga:0,form:[],sample:0};let gf=0,ga=0;const form=[];for(const m of xs){const home=m.teams.home.id===Number(teamId);const f=home?num(m.goals.home):num(m.goals.away);const g=home?num(m.goals.away):num(m.goals.home);gf+=f;ga+=g;form.push(f>g?'G':f===g?'E':'P');}return {gf:gf/xs.length,ga:ga/xs.length,form,sample:xs.length};}
function seasonAverage(stats,pathA,pathB){const a=stats?.goals?.[pathA]?.average?.[pathB];return num(a)||num(stats?.goals?.[pathA]?.average?.total);}
function cardAverage(stats,type){const cards=stats?.cards?.[type]||{};let total=0;for(const v of Object.values(cards)) total+=num(v?.total);const played=num(stats?.fixtures?.played?.total)||1;return total/played;}
function formHtml(form){return `<div class="form-strip">${(form.length?form:['—']).map(x=>`<span class="${x==='G'?'win':x==='E'?'draw':x==='P'?'loss':''}">${x}</span>`).join('')}</div>`;}
function meter(label,value,accent=''){return `<div class="meter-row"><div><span>${label}</span><b>${Math.round(value)}%</b></div><div class="meter"><i style="width:${clamp(value,0,100)}%" class="${accent}"></i></div></div>`;}

export async function renderStatisticalAnalysis({fixtureId,league,homeId,awayId,homeName,awayName,homeLogo='',awayLogo='',date=''}){
  const seasonStart=new Date().getMonth()>=6?new Date().getFullYear():new Date().getFullYear()-1;
  const season=`${seasonStart}-${String(seasonStart+1).slice(-2)}`;
  try{
    const [homeStats,awayStats,homeRecentData,awayRecentData,h2hData]=await Promise.all([
      getTeamStats(homeId,league,season),getTeamStats(awayId,league,season),getTeamMatches(homeId,league,season,6),getTeamMatches(awayId,league,season,6),getHeadToHead(homeId,awayId,6)
    ]);
    const hs=homeStats?.response||{}; const as=awayStats?.response||{};
    const hr=avgRecent(homeRecentData?.response,homeId); const ar=avgRecent(awayRecentData?.response,awayId);
    const hSeasonFor=seasonAverage(hs,'for','home'); const hSeasonAgainst=seasonAverage(hs,'against','home');
    const aSeasonFor=seasonAverage(as,'for','away'); const aSeasonAgainst=seasonAverage(as,'against','away');
    let homeLambda=((hSeasonFor||hr.gf||1.25)+(aSeasonAgainst||ar.ga||1.25))/2;
    let awayLambda=((aSeasonFor||ar.gf||1.05)+(hSeasonAgainst||hr.ga||1.05))/2;
    if(hr.sample) homeLambda=homeLambda*.72+hr.gf*.28;
    if(ar.sample) awayLambda=awayLambda*.72+ar.gf*.28;
    homeLambda=clamp(homeLambda,.25,4.2); awayLambda=clamp(awayLambda,.2,4.0);
    const totalLambda=homeLambda+awayLambda;
    const result=scoreProbabilities(homeLambda,awayLambda);
    const btts=(1-Math.exp(-homeLambda))*(1-Math.exp(-awayLambda));
    const yellowLambda=clamp(cardAverage(hs,'yellow')+cardAverage(as,'yellow'),0,10);
    const redLambda=clamp(cardAverage(hs,'red')+cardAverage(as,'red'),0,1.5);
    const h2h=(h2hData?.response||[]).slice(0,6);
    let hh=0,hd=0,ha=0,hg=0;for(const m of h2h){const homeIs=m.teams.home.id===Number(homeId);const a=homeIs?num(m.goals.home):num(m.goals.away);const b=homeIs?num(m.goals.away):num(m.goals.home);hg+=a+b;if(a>b)hh++;else if(a===b)hd++;else ha++;}
    const h2hAvg=h2h.length?hg/h2h.length:0;
    const dateText=date?new Intl.DateTimeFormat('es-BO',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(date)):'';

    return `<section class="analysis-page">
      <button class="back-btn" data-back>← Volver a partidos</button>
      <article class="analysis-hero">
        <span class="kicker">ANÁLISIS ESTADÍSTICO · ${esc(season)}</span>
        <div class="analysis-clubs"><div><img src="${esc(homeLogo)}" alt=""><h2>${esc(homeName)}</h2></div><div class="analysis-vs"><strong>VS</strong><small>${esc(dateText)}</small></div><div><img src="${esc(awayLogo)}" alt=""><h2>${esc(awayName)}</h2></div></div>
        <p>Estimación construida con rendimiento de temporada, forma reciente y distribución de goles. Es una lectura estadística, no una garantía del resultado.</p>
      </article>

      <div class="analysis-summary-grid">
        <article class="summary-card"><span>Victoria ${esc(homeName)}</span><strong>${pct(result.home)}</strong>${meter('',result.home*100,'good')}</article>
        <article class="summary-card"><span>Empate</span><strong>${pct(result.draw)}</strong>${meter('',result.draw*100,'neutral')}</article>
        <article class="summary-card"><span>Victoria ${esc(awayName)}</span><strong>${pct(result.away)}</strong>${meter('',result.away*100,'blue')}</article>
        <article class="summary-card featured"><span>Goles estimados</span><strong>${totalLambda.toFixed(1)}</strong><small>${homeLambda.toFixed(1)} + ${awayLambda.toFixed(1)}</small></article>
      </div>

      <div class="analysis-detail-grid">
        <article class="insight-card"><div class="insight-title"><span>⚽</span><div><small>PROYECCIÓN</small><h3>Goles</h3></div></div>
          ${meter('2 o más goles',poissonAtLeast(2,totalLambda)*100,'good')}
          ${meter('3 o más goles',poissonAtLeast(3,totalLambda)*100,'blue')}
          ${meter('4 o más goles',poissonAtLeast(4,totalLambda)*100,'neutral')}
          ${meter('Ambos marcan',btts*100,'good')}
          <div class="split-stat"><div><span>${esc(homeName)}</span><b>${homeLambda.toFixed(1)}</b></div><div><span>${esc(awayName)}</span><b>${awayLambda.toFixed(1)}</b></div></div>
        </article>

        <article class="insight-card"><div class="insight-title"><span>🟨</span><div><small>DISCIPLINA</small><h3>Tarjetas</h3></div></div>
          <div class="big-stat"><strong>${yellowLambda.toFixed(1)}</strong><span>amarillas combinadas por partido<br><small>media de temporada aproximada</small></span></div>
          ${meter('3+ amarillas',poissonAtLeast(3,yellowLambda)*100,'neutral')}
          ${meter('4+ amarillas',poissonAtLeast(4,yellowLambda)*100,'neutral')}
          ${meter('5+ amarillas',poissonAtLeast(5,yellowLambda)*100,'neutral')}
          <div class="red-note"><b>🟥 ${pct(1-Math.exp(-redLambda))}</b><span>frecuencia estadística aproximada de al menos una roja</span></div>
        </article>

        <article class="insight-card"><div class="insight-title"><span>📈</span><div><small>ÚLTIMOS PARTIDOS</small><h3>Forma reciente</h3></div></div>
          <div class="team-form"><div><span>${esc(homeName)}</span>${formHtml(hr.form)}<small>${hr.sample?`${hr.gf.toFixed(1)} GF · ${hr.ga.toFixed(1)} GC por partido`:'Sin muestra reciente'}</small></div><div><span>${esc(awayName)}</span>${formHtml(ar.form)}<small>${ar.sample?`${ar.gf.toFixed(1)} GF · ${ar.ga.toFixed(1)} GC por partido`:'Sin muestra reciente'}</small></div></div>
        </article>

        <article class="insight-card"><div class="insight-title"><span>⚔️</span><div><small>CARA A CARA</small><h3>Enfrentamientos directos</h3></div></div>
          ${h2h.length?`<div class="h2h-score"><div><strong>${hh}</strong><span>${esc(homeName)}</span></div><div><strong>${hd}</strong><span>Empates</span></div><div><strong>${ha}</strong><span>${esc(awayName)}</span></div></div><div class="h2h-average"><span>Promedio de goles en ${h2h.length} duelos</span><b>${h2hAvg.toFixed(1)}</b></div>`:`<div class="empty-inline">No hay suficientes enfrentamientos directos disponibles.</div>`}
        </article>
      </div>

      <article class="method-card"><div><span>ℹ️</span><div><h3>Cómo se calcula</h3><p>Se combinan medias de goles local/visitante, últimos encuentros y una distribución de Poisson para convertir esas tasas en probabilidades. Las tarjetas se estiman a partir de los registros acumulados de temporada de ambos equipos.</p></div></div><small>Fuente: API-Football. Los porcentajes describen tendencias estadísticas y pueden cambiar cuando se actualizan los datos.</small></article>
    </section>`;
  }catch(e){return `<section class="analysis-page"><button class="back-btn" data-back>← Volver a partidos</button><div class="empty-state"><div>📊</div><h3>No se pudo completar el análisis</h3><p>${esc(e?.message||'La fuente estadística no respondió.')}</p></div></section>`;}
}
