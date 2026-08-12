import {mkdir,writeFile} from 'node:fs/promises';

const SOURCE='https://raw.githubusercontent.com/openfootball/football.json/master';
const seasons=['2023-24','2024-25','2025-26'];
const competitions={
  PL:{name:'Premier League',file:'en.1.json'},
  ELC:{name:'Championship',file:'en.2.json'},
  BL1:{name:'Bundesliga',file:'de.1.json'},
  BL2:{name:'Bundesliga 2',file:'de.2.json'},
  PD:{name:'LALIGA',file:'es.1.json'},
  FL1:{name:'Ligue 1',file:'fr.1.json'},
  SA:{name:'Serie A',file:'it.1.json'},
  PPL:{name:'Primeira Liga',file:'pt.1.json'}
};

const toScore=score=>{
  if(Array.isArray(score?.ft))return score.ft;
  if(Array.isArray(score))return score;
  return null;
};
const clean=v=>String(v??'').trim();

async function fetchJson(url){
  const response=await fetch(url,{headers:{'accept':'application/json'}});
  if(!response.ok)throw new Error(`${response.status} ${response.statusText} · ${url}`);
  return response.json();
}

const matches=[];
const teamSet=new Set();
const sourceFiles=[];

for(const season of seasons){
  for(const [code,meta] of Object.entries(competitions)){
    const url=`${SOURCE}/${season}/${meta.file}`;
    const data=await fetchJson(url);
    const rows=Array.isArray(data?.matches)?data.matches:[];
    let added=0;
    for(const item of rows){
      const score=toScore(item.score);
      const home=clean(item.team1),away=clean(item.team2);
      if(!home||!away||!score||score.length<2)continue;
      const hg=Number(score[0]),ag=Number(score[1]);
      if(!Number.isFinite(hg)||!Number.isFinite(ag))continue;
      matches.push({
        id:`${code}-${season}-${item.date}-${home}-${away}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        competition:code,
        competitionName:meta.name,
        season,
        round:clean(item.round),
        date:clean(item.date),
        home,
        away,
        homeGoals:hg,
        awayGoals:ag,
        totalGoals:hg+ag,
        source:'openfootball/football.json'
      });
      teamSet.add(`${code}::${home}`);teamSet.add(`${code}::${away}`);added++;
    }
    sourceFiles.push({competition:code,season,url,matches:added});
    console.log(`${meta.name} ${season}: ${added} partidos`);
  }
}

matches.sort((a,b)=>a.date.localeCompare(b.date)||a.competition.localeCompare(b.competition));
const db={
  version:1,
  generatedAt:new Date().toISOString(),
  source:'openfootball/football.json (CC0 public-domain dataset)',
  seasons,
  competitions:Object.fromEntries(Object.entries(competitions).map(([code,m])=>[code,m.name])),
  teamCount:teamSet.size,
  matchCount:matches.length,
  matches
};

await mkdir('data',{recursive:true});
await writeFile('data/historical-db.json',JSON.stringify(db));
await writeFile('data/historical-db-meta.json',JSON.stringify({version:db.version,generatedAt:db.generatedAt,source:db.source,seasons,competitions:db.competitions,teamCount:db.teamCount,matchCount:db.matchCount,sourceFiles},null,2));
console.log(`Historial local generado: ${matches.length} partidos, ${teamSet.size} equipos.`);
