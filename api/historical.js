// Vercel Serverless Function: historical football data proxy.
// Uses FOOTBALL_DATA_API_KEY from Vercel. The token never reaches the browser.
const BASE = 'https://api.football-data.org/v4';
const ALLOWED = new Set(['competition','matches','teams','teamMatches','match']);
const COMP_CODES = new Set(['PL','ELC','BL1','BL2','PD','FL1','SA','PPL']);

function send(res, status, body) {
  res.status(status)
    .setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
    .json(body);
}

export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) return send(res, 503, { ok:false, error:'FOOTBALL_DATA_API_KEY no configurada en Vercel.' });

  const action = String(req.query.action || '');
  const competition = String(req.query.competition || '');
  if (!ALLOWED.has(action)) return send(res, 400, { ok:false, error:'Acción no permitida.' });
  if (competition && !COMP_CODES.has(competition)) return send(res, 400, { ok:false, error:'Competición no habilitada.' });

  const q = new URLSearchParams();
  const add = (name, value) => { if (value !== undefined && value !== '') q.set(name, String(value)); };
  add('season', req.query.season);
  add('status', req.query.status);
  add('dateFrom', req.query.dateFrom);
  add('dateTo', req.query.dateTo);
  add('venue', req.query.venue);
  add('limit', req.query.limit || (action === 'matches' ? 100 : undefined));
  add('offset', req.query.offset);
  add('matchday', req.query.matchday);

  let endpoint;
  if (action === 'competition') endpoint = `/competitions/${competition}`;
  if (action === 'matches') endpoint = `/competitions/${competition}/matches`;
  if (action === 'teams') endpoint = `/competitions/${competition}/teams`;
  if (action === 'teamMatches') endpoint = `/teams/${encodeURIComponent(req.query.teamId)}/matches`;
  if (action === 'match') endpoint = `/matches/${encodeURIComponent(req.query.matchId)}`;
  if (!endpoint) return send(res, 400, { ok:false, error:'Parámetros insuficientes.' });

  try {
    const r = await fetch(`${BASE}${endpoint}?${q.toString()}`, {
      headers: { 'X-Auth-Token': token, 'Accept': 'application/json' }
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error:text }; }
    if (!r.ok) return send(res, r.status, { ok:false, status:r.status, upstream:data });
    return send(res, 200, { ok:true, data });
  } catch (error) {
    return send(res, 502, { ok:false, error:'No se pudo consultar la fuente histórica.', detail:String(error?.message || error) });
  }
}
