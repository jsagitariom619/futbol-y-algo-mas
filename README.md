# Fútbol Hub — PWA modular

Esta entrega transforma el HTML monolítico original en una base modular para una aplicación móvil de resultados y estadísticas de fútbol.

## Auditoría previa
- Archivo original: stake_1_5_mundial_2026_cuadro_final_un_solo_partido.html
- Tamaño: 98323 bytes
- Líneas: 243
- Bloques `<script>`: 1
- Bloques `<style>`: 1
- Funciones JS detectadas: 44
- Usos de localStorage: 5
- Handlers inline: 32
- Datos de partidos/equipos embebidos: sí
- Manifest: no
- Service Worker: no

## Cambios
- Separación de HTML/CSS/JS/datos.
- Navegación responsive tipo app.
- PWA con manifest + service worker.
- Datos separados por competición.
- Registro ampliado de competiciones.
- Mundial 2026 conservado como histórico.
- Módulos de dashboard, competiciones, partidos, equipos y clasificaciones.
- Registro de fuentes oficiales para trazabilidad.
- Diseño móvil moderno, oscuro y compacto.

## Fuentes verificadas en esta entrega
- Premier League 2026/27: https://www.premierleague.com/en/tables/premier-league/2026-27
- LALIGA 2026/27: https://www.laliga.com/laliga-easports/clubes
- LALIGA HYPERMOTION 2026/27: https://www.laliga.com/es-CA/laliga-hypermotion/clubes
- Bundesliga 2026/27: https://www.bundesliga.com/en/bundesliga/clubs
- UEFA Champions League 2026/27: https://www.uefa.com/uefachampionsleague/clubs/

## Auditoría posterior
Se verificó:
- todos los módulos referenciados existen;
- manifest y service worker existen;
- los imports relativos apuntan a archivos existentes;
- JSON de fuentes y registros son válidos;
- la app ya no depende del `<script>` monolítico original;
- no se introdujeron dependencias externas obligatorias.

## Próxima fase
Conectar un proveedor de datos autorizado/estable para sincronizar resultados y estadísticas reales por competición, manteniendo la separación entre datos, interfaz y lógica.
