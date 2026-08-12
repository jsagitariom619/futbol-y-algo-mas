const BASE = 'https://api.football-data.org/v4';
const ALLOWED = new Set(['competition','matches','teams','teamMatches','match']);
const COMP_CODES = new Set(['PL','ELC','BL1','BL2','PD','FL1','SA','PPL','CL','EL','UCL']);

function send(res, status, body) {
  return res.status(status)
    .setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
    .json(body);
}

export default async function handler(req, res) {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) return send(res, 503, { ok:false, error:'FOOTBALL_DATA_API_KEY no está configurada en Vercel.' });

  const action = String(req.query.action || '');
  const competition = String(req.query.competition || '');
  if (!ALLOWED.has(action)) return send(res, 400, { ok:false, error:'Acción histórica no permitida.' });
  if (competition && !COMP_CODES.has(competition)) return send(res, 400, { ok:false, error:'Competición no habilitada.' });

  const q = new URLSearchParams();
  for (const key of ['season','status','dateFrom','dateTo','venue','limit','offset','matchday','competitions']) {
    if (req.query[key] !== undefined && req.query[key] !== '') q.set(key, String(req.query[key]));
  }
  if (!q.has('limit') && action === 'matches') q.set('limit', '100');

  let endpoint = '';
  if (action === 'competition') endpoint = `/competitions/${competition}`;
  if (action === 'matches') endpoint = `/competitions/${competition}/matches`;
  if (action === 'teams') endpoint = `/competitions/${competition}/teams`;
  if (action === 'teamMatches') endpoint = `/teams/${encodeURIComponent(req.query.teamId)}/matches`;
  if (action === 'match') endpoint = `/matches/${encodeURIComponent(req.query.matchId)}`;
  if (!endpoint) return send(res, 400, { ok:false, error:'Faltan parámetros para la consulta histórica.' });

  try {
    const upstream = await fetch(`${BASE}${endpoint}?${q.toString()}`, {
      headers: {
        'X-Auth-Token': token,
        'Accept': 'application/json',
        'X-Unfold-Bookings': 'true'
      }
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text }; }
    if (!upstream.ok) return send(res, upstream.status, { ok:false, status:upstream.status, upstream:data });
    return send(res, 200, { ok:true, data });
  } catch (error) {
    return send(res, 502, { ok:false, error:'No se pudo consultar la fuente histórica.', detail:String(error?.message || error) });
  }
}
