# Fútbol Analytics

Plataforma PWA modular para datos, estadísticas y análisis futbolístico.

## Enfoque
- Fixtures y calendarios.
- Clasificaciones.
- Fichas de equipos.
- Historial de resultados.
- Frecuencias históricas de goles.
- Córners, tarjetas, fuera de juego y tiros cuando la fuente los proporciona.
- Muestra, temporada y fuente visibles.
- Nunca sustituir datos desconocidos por ceros inventados.

## Fuente estadística
La integración preparada utiliza API-Football como proveedor de datos. Su documentación indica que dispone de estadísticas de partido como tiros, córners, fueras de juego, tarjetas, posesión y pases, y que la cobertura puede variar por competición y temporada. La aplicación debe respetar esa cobertura y mostrar “Sin datos” cuando corresponda.

## Configuración en Vercel
Crear una variable de entorno:

`API_FOOTBALL_KEY`

No colocar la clave dentro de JavaScript del navegador. El proxy no expone endpoints de cuotas ni predicciones. El archivo `api/football.js` actúa como proxy limitado y solo permite endpoints estadísticos necesarios para la aplicación.

## Auditoría
Antes de cada entrega:
1. Revisar estructura y código actual.
2. Revisar fuentes y cobertura.
3. Implementar.
4. Validar imports, rutas, fechas y estados vacíos.
5. Revisar que ningún valor desconocido aparezca como 0.
6. Volver a comprobar PWA, navegación y regresiones.
