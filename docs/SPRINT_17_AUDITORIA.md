\# Sprint 17 — Auditoría final, demo y defensa técnica



\## Estado general



El Sprint 17 tuvo como objetivo cerrar una versión estable y presentable de PORCYS / Porcícola Tarsicio, realizando auditoría funcional, validación de módulos, verificación de respaldos, revisión de exportaciones y preparación para demostración técnica.



\## Respaldo de base de datos



Se confirmó la existencia de respaldos SQL en:



\- C:\\RESPALDOS\_PORCYS

\- respaldo\_sprint17\_pre\_auditoria\_funcional.sql

\- respaldo\_sprint17\_post\_auditoria\_funcional.sql



También se corrigió un respaldo SQL que había quedado accidentalmente dentro de la raíz del repositorio, moviéndolo fuera de C:\\PORCYS hacia C:\\RESPALDOS\_PORCYS.



\## Estado Git



Se verificó el estado del repositorio:



\- Rama: main

\- Sin archivos modificados

\- Sin archivos pendientes por commit

\- Sin archivos SQL dentro del repositorio



Último commit previo:



\- Sprint 16 - Unificacion visual clara del frontend



\## Auditoría técnica



Se verificó:



\- MySQL/XAMPP funcionando

\- Backend Laravel funcionando

\- Frontend React/Vite funcionando

\- npm run build aprobado

\- php artisan migrate:status funcionando

\- php artisan route:list funcionando

\- /api/dashboard respondiendo correctamente



\## Módulos auditados



Se revisaron los siguientes módulos:



\- Dashboard

\- Animales

\- Detalle de animal

\- Corrales

\- Detalle de corral

\- Inventario

\- Alimentación

\- Medicamentos

\- Sanidad / Eventos sanitarios

\- Gestaciones

\- Maternidad

\- Detalle de camada

\- Mortalidad / Bajas

\- Alertas

\- Clientes

\- Ventas

\- Finanzas

\- Reportes

\- Compras / Proveedores



\## Resultado de auditoría funcional



Todos los módulos cargaron correctamente sin errores 500 visibles, sin errores CORS y con peticiones principales en estado 200.



\## Exportaciones verificadas



Se verificaron descargas funcionales de:



\- PDF de ventas

\- PDF financiero

\- Excel financiero

\- Reporte de inventario

\- Reporte sanitario

\- Reporte de mortalidad / bajas

\- Excel de ventas



\## Validaciones verificadas



Se comprobó que el sistema bloquea una venta incompleta de abasto cuando no se selecciona ningún animal.



Mensaje mostrado:



"Selecciona al menos un animal de abasto."



\## Datos de prueba



Se creó un cliente de demostración para auditoría:



\- Cliente Demo Sprint 17

\- Teléfono: 0000000000

\- Email: demo.sprint17@porcys.test

\- Dirección: Demo auditoría Sprint 17



\## Observaciones



Se detectaron únicamente warnings menores relacionados con Chart.js y el plugin Filler. No afectan la operación ni bloquean la demo.



Los errores rojos observados inicialmente en consola desaparecieron al usar Chrome limpio sin extensiones, por lo que se atribuyen a extensiones del navegador y no al sistema.



\## Conclusión



PORCYS queda en estado estable para demo técnica y defensa del proyecto. El sistema demuestra trazabilidad, gestión productiva, control sanitario, inventario, ventas, finanzas, reportes y validaciones operativas.

