<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Mortalidad y Bajas</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #222;
        }

        h1 {
            text-align: center;
            margin-bottom: 5px;
        }

        .subtitulo {
            text-align: center;
            margin-bottom: 20px;
            color: #666;
        }

        .resumen {
            margin-bottom: 20px;
        }

        .resumen p {
            margin: 4px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th {
            background: #1f2937;
            color: white;
            padding: 8px;
            border: 1px solid #ccc;
        }

        td {
            padding: 6px;
            border: 1px solid #ccc;
            text-align: center;
        }

        .tipo-muerte {
            color: #b91c1c;
            font-weight: bold;
        }

        .tipo-descarte {
            color: #92400e;
            font-weight: bold;
        }

        .footer {
            margin-top: 25px;
            text-align: right;
            color: #666;
            font-size: 11px;
        }
    </style>
</head>

<body>

    <h1>Reporte de Mortalidad y Bajas</h1>

    <div class="subtitulo">
        PORCYS
    </div>

    <div class="resumen">
        <p><strong>Total de muertes:</strong> {{ $totalMuertes }}</p>
        <p><strong>Total de descartes:</strong> {{ $totalDescartes }}</p>
        <p><strong>Pérdida económica estimada:</strong>
            ${{ number_format($perdidaTotal, 2) }}
        </p>

        <br>

        <p><strong>Bajas por causa:</strong></p>

        <ul>
            @foreach($porCausa as $causa => $cantidad)
                <li>
                    {{ ucfirst(str_replace('_', ' ', $causa)) }}
                    : {{ $cantidad }}
                </li>
            @endforeach
        </ul>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Animal</th>
                <th>Causa</th>
                <th>Etapa</th>
                <th>Estado previo</th>
                <th>Corral</th>
                <th>Pérdida</th>
            </tr>
        </thead>

        <tbody>
            @forelse($muertes as $muerte)
                <tr>
                    <td>{{ $muerte->fecha }}</td>

                    <td class="{{ $muerte->tipo_baja === 'descarte'
                        ? 'tipo-descarte'
                        : 'tipo-muerte' }}">

                        {{ ucfirst($muerte->tipo_baja ?? 'muerte') }}
                    </td>

                    <td>
                        {{ $muerte->animal->identificador
                            ?? $muerte->animal->codigo
                            ?? $muerte->animal->nombre
                            ?? ('Animal #' . $muerte->animal_id) }}
                    </td>

                    <td>
                        {{ ucfirst(str_replace('_', ' ', $muerte->causa)) }}
                    </td>

                    <td>
                        {{ $muerte->etapa_animal_snapshot ?? 'Sin etapa' }}
                    </td>

                    <td>
                        {{ $muerte->estado_anterior_animal ?? 'Sin estado' }}
                    </td>

                    <td>
                        {{ $muerte->corral->nombre
                            ?? $muerte->corral->codigo
                            ?? 'Sin corral' }}
                    </td>

                    <td>
                        ${{ number_format($muerte->costo_estimado_perdida ?? 0, 2) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">
                        No existen bajas registradas.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Generado:
        {{ $fechaGeneracion->format('d/m/Y H:i') }}
    </div>

</body>
</html>