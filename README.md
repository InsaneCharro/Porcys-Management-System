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