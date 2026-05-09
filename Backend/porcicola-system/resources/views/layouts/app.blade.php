<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Sistema Porcícola</title>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        body {
            margin: 0;
            font-family: Arial;
            display: flex;
        }

        /* SIDEBAR */
        .sidebar {
            width: 220px;
            height: 100vh;
            background: #2c3e50;
            color: white;
            padding-top: 20px;
        }

        .sidebar h2 {
            text-align: center;
            margin-bottom: 30px;
        }

        .sidebar a {
            display: block;
            padding: 15px;
            color: white;
            text-decoration: none;
        }

        .sidebar a:hover {
            background: #34495e;
        }

        /* CONTENIDO */
        .main {
            flex: 1;
            padding: 20px;
            background: #f5f6fa;
        }

    </style>
</head>

<body>

    <div class="sidebar">
        <h2>🐖 Sistema</h2>

        <a href="/dashboard">Dashboard</a>
        <a href="/animales">Animales</a>
        <a href="#">Gestaciones</a>
        <a href="#">Partos</a>
        <a href="#">Pesos</a>
    </div>

    <div class="main">
        @yield('content')
    </div>

</body>
</html>