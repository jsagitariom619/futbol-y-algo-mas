import {mkdir,writeFile} from 'node:fs/promises';

const seasons={'2023-24':'2324','2024-25':'2425','2025-26':'2526'};
const competitions={
  PL:{name:'Premier League',file:'E0'},ELC:{name:'Championship',file:'E1'},
  BL1:{name:'Bundesliga',file:'D1'},BL2:{name:'Bundesliga 2',file:'D2'},
  PD:{name:'LALIGA',file:'SP1'},FL1:{name:'Ligue 1',file:'F1'},
  SA:{name:'Serie A',file:'I1'},PPL:{name:'Primeira Liga',file:'P1'}
};

function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v!==''))rows.push(row);row=[];}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}if(!rows.length)return [];
  const headers=rows[0].map(h=>h.trim());return rows.slice(1).map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??''])));
}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
const clean=v=>String(v??'').trim();
const parseDate=v=>{const s=clean(v),p=s.split(/[\/.-]/);if(p.length!==3)return s;let[d,m,y]=p;if(y.length===2)y=`20${y}`;return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;};
async function fetchText(url){const response=await fetch(url,{headers:{accept:'text/csv,text/plain,*/*','user-agent':'Mozilla/5.0'}});if(!response.ok)throw new Error(`${response.status} ${response.statusText} · ${url}`);return response.text();}

const matches=[],teamSet=new Set(),sourceFiles=[];
for(const [season,folder] of Object.entries(seasons)){
  for(const [code,meta] of Object.entries(competitions)){
    const url=`https://www.football-data.co.uk/mmz4281/${folder}/${meta.file}.csv`;
    let text;try{text=await fetchText(url);}catch(error){console.warn(`Omitido ${meta.name} ${season}: ${error.message}`);sourceFiles.push({competition:code,season,url,matches:0,available:false});continue;}
    const rows=parseCsv(text);let added=0;
    for(const item of rows){
      const home=clean(item.HomeTeam),away=clean(item.AwayTeam),hg=num(item.FTHG),ag=num(item.FTAG);if(!home||!away||hg==null||ag==null)continue;
      const date=parseDate(item.Date);matches.push({
        id:`${code}-${season}-${date}-${home}-${away}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),competition:code,competitionName:meta.name,season,date,home,away,
        homeGoals:hg,awayGoals:ag,totalGoals:hg+ag,result:clean(item.FTR),
        shotsHome:num(item.HS),shotsAway:num(item.AS),shotsOnTargetHome:num(item.HST),shotsOnTargetAway:num(item.AST),
        cornersHome:num(item.HC),cornersAway:num(item.AC),foulsHome:num(item.HF),foulsAway:num(item.AF),
        yellowHome:num(item.HY),yellowAway:num(item.AY),redHome:num(item.HR),redAway:num(item.AR),source:'football-data.co.uk'
      });teamSet.add(`${code}::${home}`);teamSet.add(`${code}::${away}`);added++;
    }
    sourceFiles.push({competition:code,season,url,matches:added,available:true});console.log(`${meta.name} ${season}: ${added} partidos`);
  }
}
if(!matches.length)throw new Error('No se pudo generar la base histórica enriquecida.');
matches.sort((a,b)=>a.date.localeCompare(b.date)||a.competition.localeCompare(b.competition));
const db={version:3,generatedAt:new Date().toISOString(),source:'football-data.co.uk historical CSV files',seasons:Object.keys(seasons),competitions:Object.fromEntries(Object.entries(competitions).map(([code,m])=>[code,m.name])),teamCount:teamSet.size,matchCount:matches.length,fields:{goals:true,corners:true,yellowCards:true,redCards:true,shots:true,shotsOnTarget:true,fouls:true},matches};
await mkdir('data',{recursive:true});await writeFile('data/historical-db.json',JSON.stringify(db));await writeFile('data/historical-db-meta.json',JSON.stringify({version:db.version,generatedAt:db.generatedAt,source:db.source,seasons:db.seasons,competitions:db.competitions,teamCount:db.teamCount,matchCount:db.matchCount,fields:db.fields,sourceFiles},null,2));console.log(`Base histórica enriquecida: ${matches.length} partidos, ${teamSet.size} equipos.`);