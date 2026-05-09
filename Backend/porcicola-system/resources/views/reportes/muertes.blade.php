<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Bajas</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h1 {
            text-align: center;
            color: #C62828;
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
            background: #C62828;
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

    <h1>PORCYS - Reporte de Bajas</h1>

    <div class="fecha">
        Generado: {{ $fecha->format('d/m/Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Animal</th>
                <th>Causa</th>
                <th>Peso</th>
                <th>Observaciones</th>
            </tr>
        </thead>

        <tbody>
            @foreach($muertes as $muerte)
                <tr>
                    <td>{{ $muerte->fecha }}</td>
                    <td>{{ $muerte->animal->identificador_unico ?? 'N/A' }}</td>
                    <td>{{ $muerte->causa }}</td>
                    <td>{{ $muerte->peso ?? 'N/A' }} kg</td>
                    <td>{{ $muerte->observaciones ?? 'Sin observaciones' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>