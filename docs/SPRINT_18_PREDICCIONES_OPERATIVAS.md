# Sprint 18 — Predicciones operativas

## Estado
Cerrado y probado.

## Objetivo
Implementar un módulo de predicciones operativas para apoyar la toma de decisiones administrativas y productivas en PORCYS.

El módulo calcula estimaciones sin modificar datos reales de la base de datos.

## Alcance implementado

### Backend
Se creó el controlador:

- `app/Http/Controllers/PrediccionController.php`

Se agregaron endpoints:

- `GET /api/predicciones/resumen`
- `GET /api/predicciones/alimento`
- `GET /api/predicciones/partos`
- `GET /api/predicciones/corrales`
- `GET /api/predicciones/riesgos`

### Frontend
Se creó:

- `src/pages/Predicciones.jsx`
- `src/services/prediccionesService.js`

Se actualizó:

- `src/App.jsx`
- `src/components/Sidebar.jsx`

Ruta frontend:

- `/predicciones`

## Predicción de alimento

El sistema calcula consumo estimado por etapa productiva usando tasas internas fijas:

- lechon: 0.8 kg/día
- destete: 1.2 kg/día
- engorda: 2.8 kg/día
- gestante: 2.5 kg/día
- maternidad/lactante: 5.0 kg/día
- reproductor/reproductora: 2.7 kg/día
- enfermería: 1.5 kg/día
- general: 2.0 kg/día

El sistema devuelve:

- animales activos por etapa
- consumo diario estimado
- consumo estimado a 30 días
- consumo estimado a 90 días
- consumo estimado a 365 días
- stock total de alimento en inventario
- días estimados de cobertura
- nivel de riesgo por cobertura

## Predicción de partos

El sistema consulta gestaciones con fecha probable de parto y agrupa:

- próximos 7 días
- próximos 15 días
- próximos 30 días
- próximos 60 días

También devuelve:

- hembra relacionada
- identificador
- fecha probable de parto
- días restantes
- nivel de urgencia

## Predicción de corrales

El sistema calcula por corral:

- capacidad
- animales ocupando el corral
- espacios disponibles
- porcentaje de ocupación
- tipo de corral
- estado de riesgo

Estados usados:

- normal
- alto
- crítico
- saturado
- sin capacidad

También calcula riesgo de maternidad comparando partos próximos contra espacios disponibles de maternidad.

## Riesgos operativos

Se calculan riesgos de:

- alimento insuficiente
- corrales con ocupación alta/crítica/saturada
- partos próximos
- saturación de maternidad
- medicamentos con stock bajo, si existe tabla y stock disponible

Este módulo no reemplaza el módulo de Alertas. Predicciones funciona como análisis operativo para planeación.

## Pruebas realizadas

Backend:

- `php artisan route:list`
- `GET /api/predicciones/resumen`
- `GET /api/predicciones/alimento`
- `GET /api/predicciones/partos`
- `GET /api/predicciones/corrales`
- `GET /api/predicciones/riesgos`

Frontend:

- carga de `/predicciones`
- visualización desde sidebar
- consumo estimado de alimento
- partos próximos
- ocupación de corrales
- riesgos operativos
- `npm run build`

## Restricciones respetadas

- No se usó `migrate:fresh`.
- No se usó `migrate:rollback`.
- No se usó `db:wipe`.
- No se modificaron datos reales.
- No se ejecutó `partos:procesar`.
- No se crearon migraciones innecesarias.
- No se crearon modelos paralelos para animales.
- El módulo usa datos existentes.

## Resultado funcional observado

El endpoint `/api/predicciones/resumen` devuelve:

- fecha de cálculo
- predicción de alimento
- predicción de partos
- predicción de corrales
- riesgos operativos
- resumen ejecutivo

El módulo frontend `/predicciones` muestra la información en tarjetas y tablas con tema claro consistente.