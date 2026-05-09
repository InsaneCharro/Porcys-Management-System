@extends('layouts.app')

@section('content')


<h1>🐖 Dashboard Porcícola</h1>

<div class="grid">
    <div class="card">
        <p>Total animales</p>
        <h2 id="total">0</h2>
    </div>

    <div class="card">
        <p>Muertes</p>
        <h2 id="muertes">0</h2>
    </div>

    <div class="card">
        <p>Lechones</p>
        <h2 id="lechones">0</h2>
    </div>

    <div class="card">
        <p>Peso promedio</p>
        <h2 id="peso">0</h2>
    </div>
</div>

<label>Seleccionar animal:</label>
<select id="selectorAnimal"></select>

<h2>📊 Animales por etapa</h2>
<canvas id="graficaEtapas"></canvas>

<h2>⚖️ Peso promedio por etapa</h2>
<canvas id="graficaPesos"></canvas>

<h2>📈 Crecimiento por animal</h2>
<canvas id="graficaAnimal"></canvas>

<h2>📊 Comparación de crecimiento</h2>
<canvas id="graficaComparacion"></canvas>

<h2>📈 Curva ideal vs real</h2>
<canvas id="graficaIdeal"></canvas>

<h3>🚨 Alertas por curva</h3>
<ul id="alertasCurva"></ul>

<h2>🏆 Ranking de animales</h2>
<table border="1" id="tablaRanking">
    <thead>
        <tr>
            <th>#</th>
            <th>ID</th>
            <th>Identificador</th>
            <th>Score</th>
        </tr>
    </thead>
    <tbody></tbody>
</table>

<div class="alert">
    <strong>Alertas:</strong>
    <ul id="alertas"></ul>
</div>

<script>

fetch('/api/animales')
    .then(res => res.json())
    .then(data => {

        let select = document.getElementById('selectorAnimal');

        data.forEach(animal => {

            let option = document.createElement('option');
            option.value = animal.id;
            option.text = animal.identificador_unico;

            select.appendChild(option);
        });

        // cargar primer animal automáticamente
        if (data.length > 0) {
            cargarDatos(data[0].id);
        }


    });

</script>

<script>

<script>

function cargarDatos(animalId) {

    // =========================
    // GRÁFICA DE CRECIMIENTO
    // =========================
    fetch(`/api/pesos/historial/${animalId}`)
    .then(res => res.json())
    .then(data => {

        const edades = data.map(p => p.edad_dias);
        const pesos = data.map(p => p.peso);

        // 🔥 DESTRUIR SI YA EXISTE
        if (window.chartAnimal) {
            window.chartAnimal.destroy();
        }

        window.chartAnimal = new Chart(document.getElementById('graficaAnimal'), {
            type: 'line',
            data: {
                labels: edades,
                datasets: [{
                    label: 'Crecimiento del animal',
                    data: pesos,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Edad (días)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Peso (kg)'
                        }
                    }
                }
            }
        });

    });


    // =========================
    // ALERTAS POR CURVA
    // =========================
    fetch(`/api/pesos/alerta-curva/${animalId}`)
    .then(res => res.json())
    .then(data => {

        let lista = document.getElementById('alertasCurva');
        lista.innerHTML = '';

        if (data.alertas.length === 0) {
            lista.innerHTML = '<li>✔ Crecimiento óptimo</li>';
            return;
        }

        data.alertas.forEach(a => {
            let li = document.createElement('li');
            li.innerText = `Edad ${a.edad_dias} días → bajo peso (${a.peso_real} vs ideal ${a.peso_ideal})`;
            lista.appendChild(li);
        });

    });


    // =========================
    // CURVA IDEAL VS REAL
    // =========================
    fetch(`/api/pesos/historial/${animalId}`)
    .then(res => res.json())
    .then(data => {

        const real = data.map(p => ({
            x: p.edad_dias,
            y: p.peso
        }));

        const curvaIdeal = [
            { x: 0, y: 1.2 },
            { x: 10, y: 3.5 },
            { x: 28, y: 7.5 },
            { x: 70, y: 25 },
            { x: 150, y: 100 }
        ];

        // 🔥 DESTRUIR SI YA EXISTE
        if (window.chartIdeal) {
            window.chartIdeal.destroy();
        }

        window.chartIdeal = new Chart(document.getElementById('graficaIdeal'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Animal real',
                        data: real,
                        borderWidth: 3
                    },
                    {
                        label: 'Curva ideal',
                        data: curvaIdeal,
                        borderDash: [5,5],
                        borderWidth: 2
                    }
                ]
            },
            options: {
                parsing: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Edad (días)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Peso (kg)'
                        }
                    }
                }
            }
        });

    });

}

</script>

<script>

document.getElementById('selectorAnimal').addEventListener('change', function() {
    cargarDatos(this.value);
});

</script>

<script>
fetch('/api/dashboard')
    .then(res => res.json())
    .then(data => {

        // ======== TARJETAS ========
        document.getElementById('total').innerText = data.total_animales;
        document.getElementById('muertes').innerText = data.muertes;

        let lechones = data.por_etapa.find(e => e.etapa_actual === 'lechon');
        document.getElementById('lechones').innerText = lechones ? lechones.total : 0;

        let peso = data.peso_promedio.find(p => p.etapa === 'lechon');
        document.getElementById('peso').innerText = peso ? parseFloat(peso.promedio).toFixed(2) : 0;

        // ======== ALERTAS ========
        let lista = document.getElementById('alertas');
        lista.innerHTML = '';

        data.alertas_crecimiento.forEach(id => {
            let li = document.createElement('li');
            li.innerText = 'Animal ID: ' + id + ' con bajo crecimiento';
            lista.appendChild(li);
        });

        // ======== GRAFICA ETAPAS ========
        const etapas = data.por_etapa.map(e => e.etapa_actual);
        const cantidades = data.por_etapa.map(e => e.total);

        new Chart(document.getElementById('graficaEtapas'), {
            type: 'bar',
            data: {
                labels: etapas,
                datasets: [{
                    label: 'Animales por etapa',
                    data: cantidades
                }]
            }
        });

        // ======== GRAFICA PESOS ========
        const etapasPeso = data.peso_promedio.map(p => p.etapa);
        const pesos = data.peso_promedio.map(p => parseFloat(p.promedio));

        new Chart(document.getElementById('graficaPesos'), {
            type: 'line',
            data: {
                labels: etapasPeso,
                datasets: [{
                    label: 'Peso promedio',
                    data: pesos
                }]
            }
        });

    });
</script>

<script>

// ⚠️ cambia el ID por uno que exista en tu BD
let animalId = 18;

fetch(`/api/pesos/historial/${animalId}`)
    .then(res => res.json())
    .then(data => {

        const edades = data.map(p => p.edad_dias);
        const pesos = data.map(p => p.peso);

        new Chart(document.getElementById('graficaAnimal'), {
            type: 'line',
            data: {
                labels: EDADES,
                datasets: [{
                    label: 'Crecimiento del animal',
                    data: pesos
                }]
            }
        });

    });

</script>

<script>

let ids = [18,17,16]; // cambia por IDs reales

fetch(`/api/pesos/comparacion?ids=${ids.join(',')}`)
    .then(res => res.json())
    .then(data => {

        let datasets = [];

        Object.keys(data).forEach(id => {

            const puntos = data[id];

            datasets.push({
                label: 'Animal ' + id,
                data: puntos.map(p => ({
                    x: p.edad_dias,
                    y: p.peso
                })),
                fill: false
            });

        });

        new Chart(document.getElementById('graficaComparacion'), {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                parsing: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Edad (días)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Peso (kg)'
                        }
                    }
                }
            }
        });

    });

</script>

<script>

// 🔥 CAMBIA EL ID
let animalId = 18;

// curva ideal (hardcode por ahora)
const curvaIdeal = [
    { x: 0, y: 1.2 },
    { x: 10, y: 3.5 },
    { x: 28, y: 7.5 },
    { x: 70, y: 25 },
    { x: 150, y: 100 }
];

fetch(`/api/pesos/historial/${animalId}`)
    .then(res => res.json())
    .then(data => {

        const real = data.map(p => ({
            x: p.edad_dias,
            y: p.peso
        }));

        new Chart(document.getElementById('graficaIdeal'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Animal real',
                        data: real,
                        borderWidth: 3
                    },
                    {
                        label: 'Curva ideal',
                        data: curvaIdeal,
                        borderDash: [5,5], // línea punteada
                        borderWidth: 2
                    }
                ]
            },
            options: {
                parsing: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Edad (días)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Peso (kg)'
                        }
                    }
                }
            }
        });

    });

</script>

<script>

let animalId = 18;

fetch(`/api/pesos/alerta-curva/${animalId}`)
    .then(res => res.json())
    .then(data => {

        let lista = document.getElementById('alertasCurva');
        lista.innerHTML = '';

        if (data.alertas.length === 0) {
            lista.innerHTML = '<li>✔ Crecimiento óptimo</li>';
            return;
        }

        data.alertas.forEach(a => {
            let li = document.createElement('li');
            li.innerText = `Edad ${a.edad_dias} días → bajo peso (${a.peso_real} vs ideal ${a.peso_ideal})`;
            lista.appendChild(li);
        });

    });

</script>

<script>

fetch('/api/ranking')
    .then(res => res.json())
    .then(data => {

        let tbody = document.querySelector('#tablaRanking tbody');
        tbody.innerHTML = '';

        data.forEach((a, index) => {

            let tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${a.animal_id}</td>
                <td>${a.identificador}</td>
                <td>${a.score}</td>
            `;

            tbody.appendChild(tr);
        });

    });

</script>

@endsection