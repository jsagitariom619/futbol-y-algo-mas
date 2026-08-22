import {mkdir,writeFile} from 'node:fs/promises';
const SOURCE='https://raw.githubusercontent.com/openfootball/football.json/master';
const seasons=['2023-24','2024-25','2025-26','2026-27'];
const competitions={
  'premier-league':{name:'Premier League',file:'en.1.json'},
  'bundesliga':{name:'Bundesliga',file:'de.1.json'},
  'laliga':{name:'LaLiga',file:'es.1.json'},
  'ligue-1':{name:'Ligue 1',file:'fr.1.json'},
  'serie-a':{name:'Serie A',file:'it.1.json'},
  'primeira-liga':{name:'Primeira Liga',file:'pt.1.json'},
  'champions-league':{name:'Champions League',file:'cl.json'}
};
const toScore=score=>Array.isArray(score?.ft)?score.ft:Array.isArray(score)?score:null;
const clean=v=>String(v??'').trim();
async function fetchJson(url){const response=await fetch(url,{headers:{accept:'application/json'}});if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);return response.json();}
const matches=[],teamSet=new Set(),sourceFiles=[];
for(const season of seasons){for(const [code,meta] of Object.entries(competitions)){const url=`${SOURCE}/${season}/${meta.file}`;let data;try{data=await fetchJson(url);}catch(error){console.warn(`Omitido ${meta.name} ${season}: ${error.message}`);sourceFiles.push({competition:code,season,url,matches:0,available:false});continue;}const rows=Array.isArray(data?.matches)?data.matches:[];let added=0;for(const item of rows){const score=toScore(item.score),home=clean(item.team1),away=clean(item.team2);if(!home||!away||!score||score.length<2)continue;const hg=Number(score[0]),ag=Number(score[1]);if(!Number.isFinite(hg)||!Number.isFinite(ag))continue;const rawStats=item.stats||item.statistics||{};const stats={};for(const k of ['corners','yellow','red','offsides'])if(Number.isFinite(Number(rawStats[k])))stats[k]=Number(rawStats[k]);matches.push({id:`${code}-${season}-${item.date}-${home}-${away}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),competition:code,competitionName:meta.name,season,round:clean(item.round),date:clean(item.date),home,away,homeGoals:hg,awayGoals:ag,totalGoals:hg+ag,stats,source:'openfootball/football.json'});teamSet.add(`${code}::${home}`);teamSet.add(`${code}::${away}`);added++;}sourceFiles.push({competition:code,season,url,matches:added,available:true});console.log(`${meta.name} ${season}: ${added} partidos`);}}
if(!matches.length)throw new Error('No se pudo generar la base histórica: ninguna fuente respondió.');
matches.sort((a,b)=>a.date.localeCompare(b.date)||a.competition.localeCompare(b.competition));
const db={version:2,generatedAt:new Date().toISOString(),source:'openfootball/football.json (CC0 public-domain dataset)',seasons,competitions:Object.fromEntries(Object.entries(competitions).map(([code,m])=>[code,m.name])),teamCount:teamSet.size,matchCount:matches.length,matches};
await mkdir('data',{recursive:true});await writeFile('data/historical-db.json',JSON.stringify(db));await writeFile('data/historical-db-meta.json',JSON.stringify({version:db.version,generatedAt:db.generatedAt,source:db.source,seasons,competitions:db.competitions,teamCount:db.teamCount,matchCount:db.matchCount,sourceFiles},null,2));console.log(`Base histórica precargada: ${matches.length} partidos, ${teamSet.size} equipos.`);