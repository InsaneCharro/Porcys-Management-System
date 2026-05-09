<h1>Camada del Parto #{{ $parto->id }}</h1>

<meta name="csrf-token" content="{{ csrf_token() }}">

<h3>📊 Métricas de la Camada</h3>

<ul>
    <li><strong>Total:</strong> {{ $total }}</li>
    <li><strong>Peso promedio:</strong> {{ number_format($promedio, 2) }} kg</li>
    <li>🔴 Bajo peso: {{ $bajoPeso }}</li>
    <li>🟡 Normales: {{ $normales }}</li>
    <li>🟢 Óptimos: {{ $optimos }}</li>
    <li>💀 Muertos: {{ $muertos }}</li>
</ul>

@if($bajoPeso > 0)
    <p style="color:red;">⚠️ Atención: Hay lechones con bajo peso</p>
@endif

@if($promedio < 1.2)
    <p style="color:orange;">⚠️ Promedio de camada bajo</p>
@endif

@if($muertos > 0)
    <p style="color:red; font-weight:bold;">
        ⚠️ Hay mortalidad en la camada
    </p>
@endif

@php
    $corralesLlenos = collect($parto->lechones)
        ->pluck('corral')
        ->filter()
        ->unique('id')
        ->filter(function($c) {
            return ($c->lechones_count ?? 0) >= $c->capacidad;
        });
@endphp

@if($corralesLlenos->count() > 0)
    <div style="
        background: #330000;
        color: white;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
    ">
        ⚠️ Hay corrales llenos en el sistema
    </div>
@endif

<form method="POST" action="/lechones/pesos">
    @csrf

    <div id="mensaje" style="display:none; padding:10px; margin-bottom:10px; border-radius:5px;"></div>

    <table border="1" cellpadding="5">
        <thead>
            <tr>
                <th>ID</th>
                <th>Sexo</th>
                <th>Peso Nacimiento</th>
                <th>Peso Día 10</th>
                <th>Peso Día 28</th>
                <th>Estado</th>
                <th>Clasificación</th>
                <th>Acciones</th>
                <th>Observaciones</th>
                <th>Sanidad</th>
            </tr>
        </thead>
        <tbody>
            @foreach($parto->lechones as $lechon)
            @php
                $editable = $lechon->estado == 'vivo';
            @endphp
            <tr style="
                @if($lechon->estado == 'muerto')
                    background-color: #e0e0e0;
                    color: #6c757d;
                @elseif($lechon->clasificacion == 'bajo_peso')
                    background-color: #ffcccc;
                @elseif($lechon->clasificacion == 'normal')
                    background-color: #fff3cd;
                @elseif($lechon->clasificacion == 'optimo')
                    background-color: #d4edda;
                @endif
            ">
                <td>{{ $lechon->id }}</td>
                <td>{{ $lechon->sexo }}</td>

                <td>
                    <input type="number" step="0.01"
                        name="peso_nacimiento[{{ $lechon->id }}]"
                        value="{{ $lechon->peso_nacimiento }}"
                        {{ !$editable ? 'disabled style=background:#f5f5f5;' : '' }}>
                </td>

                <td>
                    <input type="number" step="0.01"
                        name="peso_dia_10[{{ $lechon->id }}]"
                        value="{{ $lechon->peso_dia_10 }}"
                        {{ !$editable ? 'disabled style=background:#f5f5f5;' : '' }}>
                </td>

                <td>
                    <input type="number" step="0.01"
                        name="peso_dia_28[{{ $lechon->id }}]"
                        value="{{ $lechon->peso_dia_28 }}"
                        {{ !$editable ? 'disabled style=background:#f5f5f5;' : '' }}>
                </td>

                <td>
                    @if($lechon->estado == 'vivo') 🟢 Vivo
                    @elseif($lechon->estado == 'muerto') 💀 Muerto
                    @elseif($lechon->estado == 'engorda') 📈 Engorda
                    @elseif($lechon->estado == 'descartado') 🚫 Descartado
                    @endif
                </td>

                <td>
                    @if($lechon->clasificacion == 'bajo_peso') 🔴 Bajo peso
                    @elseif($lechon->clasificacion == 'normal') 🟡 Normal
                    @elseif($lechon->clasificacion == 'optimo') 🟢 Óptimo
                    @else -
                    @endif
                </td>

                <td>
                    @if($lechon->estado == 'vivo')
                        <input type="text" id="causa_{{ $lechon->id }}" placeholder="Causa">

                        <button type="button" id="btn_matar_{{ $lechon->id }}" onclick="matarLechon({{ $lechon->id }})">💀</button>

                        <button type="button" onclick="descartarLechon({{ $lechon->id }})">🚫</button>

                        <button type="button" onclick="engordaLechon({{ $lechon->id }})">📈</button>

                    @else
                        <strong>{{ ucfirst($lechon->estado) }}</strong>
                    @endif
                </td>

                <td>
                    @if($lechon->estado == 'muerto')
                        💀 {{ $lechon->causa_muerte }}
                    @elseif($lechon->estado == 'engorda')
    📈 En engorda

            @if($lechon->corral)
                @php
                    $ocupados = \App\Models\Lechon::where('corral_id', $lechon->corral->id)->count();
                    $capacidad = $lechon->corral->capacidad;
                    $porcentaje = ($ocupados / $capacidad) * 100;

                    if ($porcentaje >= 100) {
                        $color = 'red';
                        $estado = 'LLENO';
                    } elseif ($porcentaje >= 70) {
                        $color = 'orange';
                        $estado = 'MEDIO';
                    } else {
                        $color = 'green';
                        $estado = 'DISPONIBLE';
                    }
                @endphp

                <br>
                <small style="color: {{ $color }}">
                    🐖 {{ $lechon->corral->nombre }} ({{ $ocupados }}/{{ $capacidad }})
                </small>

                <br>
                <small style="color: {{ $color }}">
                    {{ $estado }}
                </small>

                @if($porcentaje >= 100)
                    <br>
                    <small style="color:red; font-weight:bold;">
                        ⚠️ Corral lleno
                    </small>
                @endif

            @else
                <br>
                <small style="color:red;">Sin corral</small>
            @endif
                    @elseif($lechon->estado == 'descartado')
                        🚫 Descartado
                    @else -
                    @endif
                </td>

                <!-- 💊 SANIDAD -->
                <td>
                    <button type="button" onclick="abrirSanidad({{ $lechon->id }})">💊</button>

                    @foreach($lechon->eventosSanitarios as $evento)
                        <div style="font-size:11px;">
                            💊 {{ ucfirst($evento->tipo) }} |
                            {{ $evento->medicamento->nombre }} |
                            {{ $evento->dosis }} ml |
                            {{ $evento->fecha }}
                        </div>
                    @endforeach
                </td>

            </tr>
            @endforeach
        </tbody>
    </table>

    <br>
    <button type="submit">Guardar Pesos</button>
</form>

<!-- MODAL SANIDAD -->
<!-- OVERLAY -->
<div id="overlaySanidad" class="overlay"></div>

<!-- MODAL -->
<div id="modalSanidad" class="modal">

    <div class="modal-header">
        <h3>💊 Aplicar medicamento</h3>
        <div id="alertaStockBajo" style="display:none; padding:8px; background:#fff3cd; color:#856404; border-radius:5px; font-size:12px;">
            ⚠️ Este medicamento tiene stock bajo
        </div>
        <span class="close" onclick="cerrarModal()">✖</span>
    </div>

    <form id="formSanidad" class="modal-body">
        <input type="hidden" name="lechon_id" id="lechon_id">

        <label>Tipo</label>
        <select name="tipo" required>
            <option value="vacuna">Vacuna</option>
            <option value="tratamiento">Tratamiento</option>
        </select>

        <label>Medicamento</label>
        <select name="medicamento_id" id="medicamentoSelect" required>
            @foreach($medicamentos as $med)
                <option value="{{ $med->id }}" data-stock="{{ $med->stock }}">
                    {{ $med->nombre }} (Stock: {{ $med->stock }})
                </option>
            @endforeach
        </select>

        <div id="stockInfo" style="font-size:12px;"></div>

        <label>Dosis</label>
        <input type="number" step="0.01" name="dosis" id="inputDosis" placeholder="Ej: 5" required>

        <label>Fecha</label>
        <input type="date" name="fecha" required>

        <label>Observaciones</label>
        <textarea name="observaciones" placeholder="Opcional"></textarea>

        <div class="modal-actions">
            <button type="submit" class="btn-primary">Guardar</button>
            <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
        </div>
    </form>

</div>

<script>
const UMBRAL_STOCK_BAJO = 10;
function abrirSanidad(id){
    document.getElementById('lechon_id').value = id;
    document.getElementById('modalSanidad').style.display = 'block';
    document.getElementById('overlaySanidad').style.display = 'block';

    // Inicializar stock
    document.getElementById('medicamentoSelect').dispatchEvent(new Event('change'));
}

function cerrarModal(){
    document.getElementById('modalSanidad').style.display = 'none';
    document.getElementById('overlaySanidad').style.display = 'none';
}

document.getElementById('overlaySanidad').addEventListener('click', cerrarModal);


// 🔥 FECHA AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    const fecha = document.querySelector('input[name="fecha"]');
    if(fecha){
        fecha.value = new Date().toISOString().split('T')[0];
    }
});


// 🔥 VALIDACIÓN STOCK
const selectMedicamento = document.getElementById('medicamentoSelect');
const inputDosis = document.getElementById('inputDosis');
const stockInfo = document.getElementById('stockInfo');
const btnGuardar = document.querySelector('.btn-primary');

let stockActual = 0;

selectMedicamento.addEventListener('change', function(){
    const selected = this.options[this.selectedIndex];
    stockActual = parseFloat(selected.dataset.stock);

    stockInfo.innerHTML = `Stock disponible: ${stockActual}`;

    const alerta = document.getElementById('alertaStockBajo');

    if(stockActual <= UMBRAL_STOCK_BAJO){
        alerta.style.display = 'block';
    } else {
        alerta.style.display = 'none';
    }

    validarDosis();
});
inputDosis.addEventListener('input', validarDosis);

function validarDosis(){
    const dosis = parseFloat(inputDosis.value);

    if (!dosis) return;

    if (stockActual <= 3){
        stockInfo.innerHTML = `⛔ Stock crítico (${stockActual})`;
        stockInfo.style.color = 'darkred';
        btnGuardar.disabled = true;
        return;
    }

    if (dosis > stockActual){
        stockInfo.innerHTML = `❌ Stock insuficiente (máx: ${stockActual})`;
        stockInfo.style.color = 'red';
        inputDosis.style.border = "2px solid red";
        btnGuardar.disabled = true;

    } else if (stockActual <= UMBRAL_STOCK_BAJO){

        stockInfo.innerHTML = `⚠️ Stock bajo (${stockActual})`;
        stockInfo.style.color = 'orange';
        inputDosis.style.border = "2px solid orange";
        btnGuardar.disabled = false;

    } else {

        stockInfo.innerHTML = `✅ Stock suficiente`;
        stockInfo.style.color = 'green';
        inputDosis.style.border = "2px solid green";
        btnGuardar.disabled = false;
    }
}


// 🔥 FETCH CORREGIDO
document.getElementById('formSanidad').addEventListener('submit', function(e){
    e.preventDefault();

    fetch('/sanidad/lechon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify(Object.fromEntries(new FormData(this)))
    })
    .then(res => {
        if (!res.ok) throw new Error("Error en servidor");
        return res.json();
    })
    .then(data => {
        if(data.success){
            alert('✅ Medicamento aplicado');
            location.reload();
        } else {
            alert(data.error);
        }
    })
    .catch(err => {
        alert(err.message);
    });
});


// 🔥 FUNCIONES EXISTENTES (SIN CAMBIOS)
function matarLechon(id) {
    const causa = document.getElementById('causa_' + id).value;

    if (!causa) {
        alert('Debes ingresar una causa');
        return;
    }

    fetch(`/lechones/${id}/muerte`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}'
        },
        body: JSON.stringify({ causa_muerte: causa })
    })
    .then(() => location.reload());
}

function descartarLechon(id) {
    fetch(`/lechones/${id}/descartar`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' }
    }).then(() => location.reload());
}

function engordaLechon(id) {
    fetch(`/lechones/${id}/engorda`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' }
    }).then(() => location.reload());
}

</script>

<style>
/* Overlay */
.overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    z-index: 999;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    width: 400px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 1000;
    padding: 20px;
}

/* Header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Close button */
.close {
    cursor: pointer;
    font-size: 18px;
}

/* Body */
.modal-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* Inputs */
.modal-body input,
.modal-body select,
.modal-body textarea {
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

/* Buttons */
.modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}

.btn-primary {
    background: #28a745;
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
}

.btn-secondary {
    background: #ccc;
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
}
</style>