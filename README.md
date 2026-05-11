# PORCYS

Sistema integral de gestión porcícola.

## Tecnologías

### Backend
- Laravel
- PHP
- MySQL

### Frontend
- React
- Vite
- Axios
- TailwindCSS

## Funcionalidades
- Gestión de animales
- Gestación
- Partos automáticos
- Inventario
- Consumo automático
- Alertas
- Dashboard
- Salud animal
- Comercialización

## Instalación

### Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

### Frontend
cd frontend
npm install
npm run dev

PORCYS — Session Update

Fecha: 11 Mayo 2026

Ventas
Implementado flujo completo de venta de pie de cría.
Corrección de validación de tipo_venta.
Sincronización frontend/backend para enum MySQL.
Registro correcto de ventas.
Eliminación automática de animales vendidos del inventario visual.
Corrección de payload enviado al backend.
Manejo mejorado de errores Axios.
Compras / Abastecimiento
Corrección del flujo convertir solicitud → orden.
Cálculo correcto de:
cantidad
precio unitario
subtotal
IVA
total
Corrección de errores undefined.
Corrección de referencia orden is not defined.
Recepción de órdenes funcional.
Visualización correcta de órdenes emitidas y recibidas.
Integración correcta de detalles de solicitud hacia orden.
UX/UI
Mejoras visuales en órdenes de compra.
Botones de estado funcionales.
Flujo general más estable.
