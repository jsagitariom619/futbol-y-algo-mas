const n=v=>typeof v==='number' && Number.isFinite(v)?v:null;
const pct=(num,den)=>den?Math.round((num/den)*100):null;
const avg=a=>{const x=a.filter(v=>typeof v==='number' && Number.isFinite(v));return x.length?Math.round(x.reduce((s,v)=>s+v,0)/x.length*100)/100:null};

export function summarizeTeamFixtures(fixtures,teamId){
  const list=(fixtures?.response||[]).filter(f=>f?.teams?.home?.id===teamId||f?.teams?.away?.id===teamId);
  const finished=list.filter(f=>['FT','AET','PEN'].includes(f?.fixture?.status?.short));
  const rows=finished.map(f=>{
    const isHome=f.teams.home.id===teamId;
    const gf=isHome?n(f.goals.home):n(f.goals.away);
    const ga=isHome?n(f.goals.away):n(f.goals.home);
    return {gf,ga,total:gf!=null&&ga!=null?gf+ga:null,venue:isHome?'home':'away',date:f.fixture?.date||null};
  });
  const valid=rows.filter(r=>r.total!=null);
  if(!rows.length) return {sample:0};
  return {
    sample:rows.length,
    avgFor:avg(rows.map(r=>r.gf)),
    avgAgainst:avg(rows.map(r=>r.ga)),
    avgTotal:avg(valid.map(r=>r.total)),
    over1:valid.length?pct(valid.filter(r=>r.total>=2).length,valid.length):null,
    over2:valid.length?pct(valid.filter(r=>r.total>=3).length,valid.length):null,
    cleanSheets:rows.length?pct(rows.filter(r=>r.ga===0).length,rows.length):null,
    localSample:rows.filter(r=>r.venue==='home').length,
    awaySample:rows.filter(r=>r.venue==='away').length,
    lastResults:rows.slice(-5).map(r=>`${r.gf}-${r.ga}`)
  };
}

export function seasonTeamStats(profile){
  const r=profile?.response||profile||{};
  const games=Number(r?.fixtures?.played?.total||0);
  const goalsFor=r?.goals?.for?.total?.total;
  const goalsAgainst=r?.goals?.against?.total?.total;
  const corners=r?.statistics?.corners;
  const cards=r?.cards;
  const shots=r?.shots;
  return {
    sample:games||0,
    avgFor:games&&goalsFor!=null?Math.round((Number(goalsFor)/games)*100)/100:null,
    avgAgainst:games&&goalsAgainst!=null?Math.round((Number(goalsAgainst)/games)*100)/100:null,
    avgCorners:corners?.for?.total!=null?Number(corners.for.total):null,
    avgCornersAgainst:corners?.against?.total!=null?Number(corners.against.total):null,
    avgShots:shots?.for?.total!=null?Number(shots.for.total):null,
    avgShotsOnTarget:shots?.on?.total!=null?Number(shots.on.total):null,
    yellow:cards?.yellow?.total!=null?Number(cards.yellow.total):null,
    red:cards?.red?.total!=null?Number(cards.red.total):null
  };
}

export function fixtureStatMap(payload){
  const out=[];
  for(const block of payload?.response||[]){
    const map={teamId:block.team?.id,team:block.team?.name};
    for(const item of block.statistics||[]) map[item.type]=item.value;
    out.push(map);
  }
  return out;
}

export function aggregateMatchStats(statRows){
  const pick=(row,key)=>n(row?.[key]);
  const keys=['Corner Kicks','Offsides','Yellow Cards','Red Cards','Total Shots','Shots on Goal','Fouls'];
  const result={};
  for(const key of keys){
    const vals=statRows.map(r=>pick(r,key)).filter(v=>v!=null);
    result[key]=vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length*100)/100:null;
  }
  return result;
}
