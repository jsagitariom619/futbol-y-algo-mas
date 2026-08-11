// Vercel Serverless Function: proxy seguro y limitado para estadísticas futbolísticas.
// Requiere la variable de entorno API_FOOTBALL_KEY en Vercel.
const BASE = 'https://v3.football.api-sports.io';
const ALLOWED = new Set([
  'leagues', 'fixtures', 'fixtureStats', 'standings', 'teamStats',
  'teamMatches', 'headToHead', 'players', 'injuries'
]);

function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json(body);
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return send(res, 503, { ok:false, error:'API_FOOTBALL_KEY no configurada en Vercel.' });

  const action = String(req.query.action || '');
  if (!ALLOWED.has(action)) return send(res, 400, { ok:false, error:'Acción no permitida.' });

  const q = req.query;
  const params = new URLSearchParams();
  const add = (name, value) => { if (value !== undefined && value !== '') params.set(name, String(value)); };

  if (action === 'leagues') {
    add('id', q.id); add('season', q.season); add('search', q.search); add('current', q.current);
  }
  if (action === 'fixtures') {
    add('league', q.league); add('season', q.season); add('id', q.id); add('team', q.team);
    add('next', q.next); add('last', q.last); add('from', q.from); add('to', q.to); add('status', q.status);
  }
  if (action === 'fixtureStats') add('fixture', q.fixture);
  if (action === 'standings') { add('league', q.league); add('season', q.season); add('team', q.team); }
  if (action === 'teamStats') { add('league', q.league); add('season', q.season); add('team', q.team); add('date', q.date); }
  if (action === 'teamMatches') { add('team', q.team); add('season', q.season); add('league', q.league); add('last', q.last); add('from', q.from); add('to', q.to); }
  if (action === 'headToHead') { add('h2h', q.h2h); add('last', q.last); }
  if (action === 'players') { add('team', q.team); add('season', q.season); add('league', q.league); add('page', q.page); }
  if (action === 'injuries') { add('team', q.team); add('season', q.season); add('league', q.league); add('fixture', q.fixture); }

  const endpoint = action === 'fixtureStats' ? 'fixtures/statistics' :
    action === 'teamStats' ? 'teams/statistics' :
    action === 'teamMatches' ? 'fixtures' :
    action === 'headToHead' ? 'fixtures/headtohead' : action;

  try {
    const r = await fetch(`${BASE}/${endpoint}?${params.toString()}`, {
      headers: { 'x-apisports-key': key, 'Accept': 'application/json' }
    });
    const data = await r.json();
    if (!r.ok) return send(res, r.status, { ok:false, upstream:data });
    return send(res, 200, { ok:true, data });
  } catch (error) {
    return send(res, 502, { ok:false, error:'No se pudo consultar la fuente estadística.', detail:String(error?.message || error) });
  }
}
