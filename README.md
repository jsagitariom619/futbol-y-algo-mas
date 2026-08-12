# Fútbol Analytics — versión estadística modular

Esta versión conserva el lenguaje visual del proyecto original, pero orienta la ficha de cada encuentro a estadísticas históricas verificables.

## Qué muestra cada encuentro
- Goles: promedios y frecuencias históricas de 2+ y 3+ goles.
- Córners: promedios a favor y concedidos cuando la fuente los proporciona.
- Tarjetas: medias de amarillas y rojas.
- Fuera de juego: dato de partido cuando está disponible; no se inventa una serie histórica.
- Tiros y tiros a puerta.
- Muestra y temporada utilizada.

## Fallback histórico
Si la temporada actual todavía no tiene una muestra suficiente, el detalle busca automáticamente la temporada anterior y luego una segunda temporada histórica.

## Datos
La aplicación usa el proxy `api/football.js` y requiere `API_FOOTBALL_KEY` configurada como variable privada en Vercel. No se coloca ninguna clave dentro del navegador.

## Regla de integridad
No se convierten campos vacíos en ceros ni se generan números ficticios. Un porcentaje como 8/10 (80% histórico) describe exclusivamente la frecuencia observada en la muestra indicada.
