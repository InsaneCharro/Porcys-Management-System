<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte Sanitario</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h1 {
            text-align: center;
            color: #6A1B9A;
        }

        .fecha {
            text-align: right;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #6A1B9A;
            color: white;
            padding: 8px;
            border: 1px solid #ccc;
        }

        td {
            padding: 8px;
            border: 1px solid #ccc;
        }
    </style>
</head>

<body>

    <h1>PORCYS - Reporte Sanitario</h1>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Animal</th>
                <th>Medicamento</th>
                <th>Dosis</th>
            </tr>
        </thead>

        <tbody>
            @foreach($aplicaciones as $app)
                <tr>
                    <td>{{ $app->fecha }}</td>
                    <td>{{ $app->animal->identificador_unico ?? 'N/A' }}</td>
                    <td>{{ $app->medicamento }}</td>
                    <td>{{ $app->dosis ?? 'N/A' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>