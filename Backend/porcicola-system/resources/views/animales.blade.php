@extends('layouts.app')

@section('content')

<h1>🐖 Animales</h1>

<h2>Agregar animal</h2>

<form id="formAnimal">

    <input type="hidden" id="animal_id">

  <input type="text" id="identificador" placeholder="Identificador" required>

    <select id="sexo">
        <option value="Macho">Macho</option>
        <option value="Hembra">Hembra</option>
    </select>

    <input type="text" id="raza" placeholder="Raza">

    <select id="madre_id">
        <option value="">Seleccionar madre</option>
        @foreach($animales as $animal)
            @if($animal->sexo == 'Hembra')
                <option value="{{ $animal->id }}">{{ $animal->identificador }}</option>
            @endif
        @endforeach
    </select>

    <select id="padre_id">
        <option value="">Seleccionar padre</option>
        @foreach($animales as $animal)
            @if($animal->sexo == 'Macho')
                <option value="{{ $animal->id }}">{{ $animal->identificador }}</option>
            @endif
        @endforeach
    </select>

    <select id="etapa">
        <option value="Lechon">Lechón</option>
        <option value="Engorda">Engorda</option>
        <option value="Gestacion">Gestación</option>
    </select>

    <input type="number" step="0.01" id="peso" placeholder="Peso">

    <select id="estado">
        <option value="Vivo">Vivo</option>
        <option value="Muerto">Muerto</option>
        <option value="Descartado">Descartado</option>
    </select>

    <input type="date" id="fecha_nacimiento" required>

    <button type="submit">Guardar</button>
    <button type="button" onclick="cancelarEdicion()">Cancelar</button>

</form>

<hr>

<h2>Lista de animales</h2>

<table border="1" width="100%">
    <thead>
        <tr>
            <th>ID</th>
            <th>Identificador</th>
            <th>Sexo</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody id="tablaAnimales"></tbody>
</table>

<script>

// ===== CARGAR TABLA =====
function cargarAnimales() {
    fetch('/api/animales')
    .then(res => res.json())
    .then(data => {

        let tbody = document.getElementById('tablaAnimales');
        tbody.innerHTML = '';

        data.forEach(a => {

            let tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${a.id}</td>
                <td>${a.identificador}</td>
                <td>${a.sexo}</td>
                <td>
                    <button onclick="editar(${a.id}, '${a.identificador}', '${a.sexo}', '${a.fecha_nacimiento}')">Editar</button>
                    <button onclick="eliminar(${a.id})">Eliminar</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

    });
}

// ===== CREAR =====
document.getElementById('formAnimal').addEventListener('submit', function(e) {
    e.preventDefault();

    let id = document.getElementById('animal_id').value;

    let data = {
        identificador: document.getElementById('identificador').value,
        sexo: document.getElementById('sexo').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,

        raza: document.getElementById('raza').value,
        madre_id: document.getElementById('madre_id').value || null,
        padre_id: document.getElementById('padre_id').value || null,

        etapa: document.getElementById('etapa').value,
        peso: document.getElementById('peso').value,
        estado: document.getElementById('estado').value
    };

    // 🔥 SI HAY ID → EDITAR
    if (id) {

        fetch(`/api/animales/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(() => {
            cancelarEdicion();
            cargarAnimales();
        });

    } else {

        // CREAR
        fetch('/api/animales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(() => {
            document.getElementById('formAnimal').reset();
            cargarAnimales();
        });

    }
});

// ===== ELIMINAR =====
function eliminar(id) {
    fetch(`/api/animales/${id}`, {
        method: 'DELETE'
    })
    .then(() => cargarAnimales());
}

// ===== INICIAL =====
cargarAnimales();

</script>

<script>

function editar(id, identificador, sexo, fecha) {

    document.getElementById('animal_id').value = id;
    document.getElementById('identificador').value = identificador;
    document.getElementById('sexo').value = sexo;
    document.getElementById('fecha_nacimiento').value = fecha;

}

</script>

<script>

function cancelarEdicion() {
    document.getElementById('animal_id').value = '';
    document.getElementById('formAnimal').reset();
}

</script>

@endsection