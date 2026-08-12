let databasePromise=null;

export const LEAGUES=[
  ['PL','Premier League'],['ELC','Championship'],['BL1','Bundesliga'],['BL2','Bundesliga 2'],
  ['PD','LALIGA'],['FL1','Ligue 1'],['SA','Serie A'],['PPL','Primeira Liga']
];
export const SEASONS=[['2023-24','2023/24'],['2024-25','2024/25'],['2025-26','2025/26']];

const normalize=value=>String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');

async function getDatabase(){
  if(!databasePromise){
    databasePromise=fetch('./data/historical-db.json',{cache:'force-cache'}).then(async response=>{
      if(!response.ok)throw new Error('La base histórica local no está disponible en este deployment.');
      return response.json();
    });
  }
  return databasePromise;
}

export async function getHistoricalDatabase(){return getDatabase();}

export async function getLocalMatches({competition,season,team}={}){
  const db=await getDatabase();
  const target=team?normalize(team):null;
  return db.matches.filter(match=>
    (!competition||match.competition===competition)&&
    (!season||match.season===season)&&
    (!target||normalize(match.home)===target||normalize(match.away)===target)
  );
}

export async function getLocalTeams(competition,season){
  const rows=await getLocalMatches({competition,season});
  const names=new Set();
  rows.forEach(m=>{names.add(m.home);names.add(m.away);});
  return [...names].sort((a,b)=>a.localeCompare(b));
}

export async function findLocalTeam(competition,name){
  const teams=await getLocalTeams(competition);
  const target=normalize(name);
  return teams.find(team=>normalize(team)===target)
    ||teams.find(team=>normalize(team).includes(target)||target.includes(normalize(team)))
    ||null;
}

export async function getTeamHistory(competition,team,{seasons=SEASONS.map(s=>s[0]),limit=30}={}){
  const rows=await getLocalMatches({competition,team});
  return rows.filter(m=>seasons.includes(m.season)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
}

export async function getHeadToHead(teamA,teamB,{competitions=null,seasons=null}={}){
  const a=normalize(teamA),b=normalize(teamB);
  const db=await getDatabase();
  const allowedCompetitions=competitions?.length?new Set(competitions):null;
  const allowedSeasons=seasons?.length?new Set(seasons):null;
  return db.matches.filter(m=>{
    const h=normalize(m.home),v=normalize(m.away);
    return (!allowedCompetitions||allowedCompetitions.has(m.competition))&&
      (!allowedSeasons||allowedSeasons.has(m.season))&&
      ((h===a&&v===b)||(h===b&&v===a));
  }).sort((x,y)=>y.date.localeCompare(x.date));
}

export function summarizeGoals(rows){
  const n=rows.length;
  if(!n)return null;
  const total=rows.reduce((sum,row)=>sum+row.totalGoals,0);
  const home=rows.reduce((sum,row)=>sum+row.homeGoals,0);
  const away=rows.reduce((sum,row)=>sum+row.awayGoals,0);
  const avg=x=>Math.round(x/n*100)/100;
  return {
    matches:n,
    totalGoals:total,
    averageGoals:avg(total),
    averageHomeGoals:avg(home),
    averageAwayGoals:avg(away),
    onePlus:Math.round(rows.filter(r=>r.totalGoals>=1).length/n*100),
    twoPlus:Math.round(rows.filter(r=>r.totalGoals>=2).length/n*100),
    threePlus:Math.round(rows.filter(r=>r.totalGoals>=3).length/n*100),
    fourPlus:Math.round(rows.filter(r=>r.totalGoals>=4).length/n*100),
    zeroGoals:Math.round(rows.filter(r=>r.totalGoals===0).length/n*100)
  };
}

export function summarizeTeam(rows,team){
  const target=normalize(team);
  const matches=rows.filter(Boolean);
  if(!matches.length)return null;
  let scored=0,conceded=0;
  for(const m of matches){
    const isHome=normalize(m.home)===target;
    scored+=isHome?m.homeGoals:m.awayGoals;
    conceded+=isHome?m.awayGoals:m.homeGoals;
  }
  const avg=x=>Math.round(x/matches.length*100)/100;
  return {matches:matches.length,goalsFor:scored,goalsAgainst:conceded,averageFor:avg(scored),averageAgainst:avg(conceded),goals:summarizeGoals(matches)};
}
