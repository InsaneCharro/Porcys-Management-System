<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dashboard Ejecutivo</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            padding: 20px;
        }

        h1 {
            text-align: center;
            color: #1565C0;
        }

        .fecha {
            text-align: right;
            margin-bottom: 30px;
        }

        table {
            width: 100%;
            border-spacing: 15px;
        }

        .card {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
            height: 90px;
        }

        .titulo {
            font-size: 14px;
            color: #555;
        }

        .valor {
            font-size: 22px;
            font-weight: bold;
            margin-top: 15px;
            color: #1565C0;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 10px;
        }

        .logo-container img {
            width: 90px;
            height: auto;
        }
    </style>
</head>

<body>

    <div class="logo-container">
        <img src="{{ public_path('logo-porcys.png') }}">
    </div>

    <h1>PORCYS - Dashboard Ejecutivo</h1>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <div style="text-align:center; margin-bottom:30px;">
        <img src="{{ $grafica }}" style="width:100%; max-width:520px;">
    </div>

    <table>
        <tr>
            <td>
                <div class="card">
                    <div class="titulo">Animales activos</div>
                    <div class="valor">{{ $totalAnimales }}</div>
                </div>
            </td>

            <td>
                <div class="card">
                    <div class="titulo">Ventas registradas</div>
                    <div class="valor">{{ $totalVentas }}</div>
                </div>
            </td>
        </tr>

        <tr>
            <td>
                <div class="card">
                    <div class="titulo">Ingresos totales</div>
                    <div class="valor">
                        MXN ${{ number_format($ingresos, 2) }}
                    </div>
                </div>
            </td>

            <td>
                <div class="card">
                    <div class="titulo">Bajas registradas</div>
                    <div class="valor">{{ $totalMuertes }}</div>
                </div>
            </td>
        </tr>

        <tr>
            <td>
                <div class="card">
                    <div class="titulo">Stock inventario</div>
                    <div class="valor">
                        {{ number_format($stockInventario, 2) }} kg
                    </div>
                </div>
            </td>

            <td>
                <div class="card">
                    <div class="titulo">Eventos sanitarios</div>
                    <div class="valor">{{ $eventosSanitarios }}</div>
                </div>
            </td>
        </tr>
    </table>

</body>
</html>