import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

export default function VentasPage() {
  const [tab, setTab] = useState('abasto');
  const [loading, setLoading] = useState(true);
  const [animales, setAnimales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [resumen, setResumen] = useState({});
  const [tipos, setTipos] = useState([]);

  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo_cliente: 'abasto',
    notas: ''
  });

  const [abastoCliente, setAbastoCliente] = useState('');
  const [precioFijoAbasto, setPrecioFijoAbasto] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  const [pieCliente, setPieCliente] = useState('');
  const [pieSeleccionados, setPieSeleccionados] = useState([]);
  const [precioFijo, setPrecioFijo] = useState('');

  const [engordaCliente, setEngordaCliente] = useState('');
  const [engordaSeleccionados, setEngordaSeleccionados] = useState([]);
  const [precioKgEngorda, setPrecioKgEngorda] = useState('');

  const [descarteCliente, setDescarteCliente] = useState('');
  const [descarteSeleccionados, setDescarteSeleccionados] = useState([]);
  const [precioKgDescarte, setPrecioKgDescarte] = useState('');

  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const normalizarTexto = (valor) => {
    return String(valor ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  };

  const estadosBloqueados = [
    'muerto',
    'muerta',
    'vendido',
    'vendida',
    'baja',
    'baja sanitaria',
    'sacrificado',
    'sacrificada',
    'sacrificio sanitario'
  ];

  const estadosDescarte = ['descartado', 'descartada', 'descarte'];

  const esAnimalBloqueado = (animal) => {
    const estado = normalizarTexto(animal.estado);
    return estadosBloqueados.includes(estado);
  };

  const esAnimalEnDescarte = (animal) => {
    const estado = normalizarTexto(animal.estado);
    const clasificacion = normalizarTexto(animal.clasificacion);
    const etapa = normalizarTexto(animal.etapa_actual);

    return (
      estadosDescarte.includes(estado) ||
      ['descarte', 'descartado', 'descartada'].includes(clasificacion) ||
      ['descarte', 'descartado', 'descartada'].includes(etapa)
    );
  };

  const esAnimalAbasto = (animal) => {
    if (esAnimalBloqueado(animal) || esAnimalEnDescarte(animal)) return false;

    const clasificacion = normalizarTexto(animal.clasificacion);
    const etapa = normalizarTexto(animal.etapa_actual);

    return (
      ['abasto', 'linea carnica', 'carnica'].includes(clasificacion) ||
      ['lechon', 'destete', 'crecimiento'].includes(etapa)
    );
  };

  const esAnimalPieCria = (animal) => {
    if (esAnimalBloqueado(animal) || esAnimalEnDescarte(animal)) return false;

    const clasificacion = normalizarTexto(animal.clasificacion);

    return [
      'pie de cria',
      'pie cria',
      'reproductor',
      'reproductora'
    ].includes(clasificacion);
  };

  const esAnimalEngorda = (animal) => {
    if (esAnimalBloqueado(animal) || esAnimalEnDescarte(animal)) return false;

    const clasificacion = normalizarTexto(animal.clasificacion);
    const etapa = normalizarTexto(animal.etapa_actual);

    return ['engorda', 'finalizacion', 'finalización'].includes(clasificacion) ||
      ['engorda', 'finalizacion', 'finalización'].includes(etapa);
  };

  const esAnimalDescarte = (animal) => {
    if (esAnimalBloqueado(animal)) return false;
    return esAnimalEnDescarte(animal);
  };

  const extraerPesoNumerico = (valor) => {
    const numero = Number(valor || 0);
    return Number.isFinite(numero) && numero > 0 ? numero : 0;
  };

  const obtenerPesoAnimal = (animal) => {
    const posiblesPesos = [
      animal?.peso,
      animal?.peso_actual,
      animal?.ultimo_peso,
      animal?.ultimo_peso_kg,
      animal?.peso_kg,
    ];

    for (const peso of posiblesPesos) {
      const pesoNumerico = extraerPesoNumerico(peso);

      if (pesoNumerico > 0) {
        return pesoNumerico;
      }
    }

    return 0;
  };

  const obtenerUltimoPesoDesdeHistorial = (payload) => {
    const lista =
      Array.isArray(payload)
        ? payload
        : payload?.data || payload?.pesos || payload?.historial || [];

    if (!Array.isArray(lista) || lista.length === 0) {
      return 0;
    }

    const ordenados = [...lista].sort((a, b) => {
      const fechaA = new Date(a.fecha || a.fecha_registro || a.created_at || 0).getTime();
      const fechaB = new Date(b.fecha || b.fecha_registro || b.created_at || 0).getTime();

      if (fechaB !== fechaA) {
        return fechaB - fechaA;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

    for (const item of ordenados) {
      const peso = extraerPesoNumerico(
        item.peso || item.peso_kg || item.valor || item.peso_registrado
      );

      if (peso > 0) {
        return peso;
      }
    }

    return 0;
  };

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN'
    });
  };

  const etiquetaTipoVenta = (tipo) => {
    const normalizado = normalizarTexto(tipo);

    if (normalizado === 'pie cria' || normalizado === 'pie de cria') {
      return 'Pie de cría';
    }

    if (normalizado === 'abasto') {
      return 'Abasto';
    }

    if (normalizado === 'engorda') {
      return 'Engorda';
    }

    if (normalizado === 'descarte') {
      return 'Descarte';
    }

    return tipo || 'N/A';
  };

  const cargarDatos = async () => {
    setLoading(true);
    setMensaje('');

    try {
      const [animalesRes, clientesRes, historialRes, resumenRes, tiposRes] = await Promise.all([
        axios.get(`${API}/animales`),
        axios.get(`${API}/clientes`),
        axios.get(`${API}/ventas/historial`),
        axios.get(`${API}/ventas/resumen`),
        axios.get(`${API}/ventas/tipos`)
      ]);

      const animalesBase = animalesRes.data || [];

      const animalesConPeso = await Promise.all(
        animalesBase.map(async (animal) => {
          const pesoDirecto = obtenerPesoAnimal(animal);

          if (pesoDirecto > 0) {
            return {
              ...animal,
              peso: pesoDirecto,
            };
          }

          try {
            const historialPesoRes = await axios.get(`${API}/pesos/historial/${animal.id}`);
            const pesoHistorial = obtenerUltimoPesoDesdeHistorial(historialPesoRes.data);

            if (pesoHistorial > 0) {
              return {
                ...animal,
                peso: pesoHistorial,
              };
            }
          } catch (error) {
            console.warn(`No se pudo cargar historial de peso del animal ${animal.id}`);
          }

          try {
            const pesoRes = await axios.get(`${API}/pesos/${animal.id}`);
            const pesoAlternativo = obtenerUltimoPesoDesdeHistorial(pesoRes.data);

            if (pesoAlternativo > 0) {
              return {
                ...animal,
                peso: pesoAlternativo,
              };
            }
          } catch (error) {
            console.warn(`No se pudo cargar peso alternativo del animal ${animal.id}`);
          }

          return animal;
        })
      );

      setAnimales(animalesConPeso);
      setClientes(clientesRes.data || []);
      setHistorial(historialRes.data || []);
      setResumen(resumenRes.data || {});
      setTipos(tiposRes.data || []);
    } catch (error) {
      console.error(error);
      alert('Error cargando módulo de ventas.');
    } finally {
      setLoading(false);
    }
  };

  const animalesDisponibles = animales.filter((animal) => !esAnimalBloqueado(animal));
  const animalesBloqueados = animales.filter((animal) => esAnimalBloqueado(animal));
  const animalesAbasto = animalesDisponibles.filter((animal) => esAnimalAbasto(animal));
  const animalesPie = animalesDisponibles.filter((animal) => esAnimalPieCria(animal));
  const animalesEngorda = animalesDisponibles.filter((animal) => esAnimalEngorda(animal));
  const animalesDescarte = animalesDisponibles.filter((animal) => esAnimalDescarte(animal));

  const toggle = (id, setter, arreglo) => {
    setter(arreglo.includes(id) ? arreglo.filter((x) => x !== id) : [...arreglo, id]);
  };

  const subtotalFijo = (ids, precio) => ids.length * Number(precio || 0);

  const subtotalPorKg = (ids, listaAnimales, precioKgVenta) => {
    return listaAnimales
      .filter((animal) => ids.includes(animal.id))
      .reduce(
        (acc, animal) =>
          acc + obtenerPesoAnimal(animal) * Number(precioKgVenta || 0),
        0
      );
  };

  const subtotalAbasto = subtotalFijo(seleccionados, precioFijoAbasto);
  const ivaAbasto = subtotalAbasto * 0.16;
  const totalAbasto = subtotalAbasto + ivaAbasto;

  const subtotalPie = subtotalFijo(pieSeleccionados, precioFijo);
  const ivaPie = subtotalPie * 0.16;
  const totalPie = subtotalPie + ivaPie;

  const subtotalEngorda = subtotalPorKg(engordaSeleccionados, animalesEngorda, precioKgEngorda);
  const ivaEngorda = subtotalEngorda * 0.16;
  const totalEngorda = subtotalEngorda + ivaEngorda;

  const subtotalDescarte = subtotalPorKg(descarteSeleccionados, animalesDescarte, precioKgDescarte);
  const ivaDescarte = subtotalDescarte * 0.16;
  const totalDescarte = subtotalDescarte + ivaDescarte;

  const crearCliente = async () => {
    if (!clienteForm.nombre.trim()) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }

    try {
      await axios.post(`${API}/clientes`, clienteForm);

      setClienteForm({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        tipo_cliente: 'abasto',
        notas: ''
      });

      setMensaje('Cliente registrado correctamente.');
      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.message || 'Error creando cliente.');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;

    try {
      await axios.delete(`${API}/clientes/${id}`);
      setMensaje('Cliente eliminado correctamente.');
      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || 'Error eliminando cliente.');
    }
  };

  const venderPrecioFijo = async ({
    clienteId,
    setCliente,
    precio,
    setPrecio,
    seleccion,
    setSeleccion,
    animalesValidos,
    tipoVenta,
    etiqueta
  }) => {
    if (!clienteId) {
      alert('Selecciona un cliente.');
      return;
    }

    if (!precio || Number(precio) <= 0) {
      alert('Captura un precio fijo válido.');
      return;
    }

    if (seleccion.length === 0) {
      alert(`Selecciona al menos un animal de ${etiqueta}.`);
      return;
    }

    const seleccionValidada = animalesValidos.filter((animal) => seleccion.includes(animal.id));

    if (seleccionValidada.length !== seleccion.length) {
      alert('Hay animales seleccionados que ya no están disponibles. Actualiza la página.');
      return;
    }

    try {
      await axios.post(`${API}/ventas`, {
        cliente_id: Number(clienteId),
        tipo_venta: tipoVenta,
        animales: seleccion.map((id) => ({
          animal_id: Number(id),
          precio_fijo: Number(precio)
        }))
      });

      setSeleccion([]);
      setPrecio('');
      setCliente('');
      setMensaje(`Venta de ${etiqueta} registrada correctamente.`);

      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || `Error registrando venta de ${etiqueta}.`);
    }
  };

  const venderPorKg = async ({
    clienteId,
    setCliente,
    precioKgVenta,
    setPrecioKgVenta,
    seleccion,
    setSeleccion,
    animalesValidos,
    tipoVenta,
    etiqueta
  }) => {
    if (!clienteId) {
      alert('Selecciona un cliente.');
      return;
    }

    if (!precioKgVenta || Number(precioKgVenta) <= 0) {
      alert('Captura un precio por kg válido.');
      return;
    }

    if (seleccion.length === 0) {
      alert(`Selecciona al menos un animal de ${etiqueta}.`);
      return;
    }

    const seleccionValidada = animalesValidos.filter((animal) => seleccion.includes(animal.id));

    if (seleccionValidada.length !== seleccion.length) {
      alert('Hay animales seleccionados que ya no están disponibles. Actualiza la página.');
      return;
    }

    const sinPeso = seleccionValidada.find((animal) => obtenerPesoAnimal(animal) <= 0);

    if (sinPeso) {
      alert(`El animal ${sinPeso.identificador_unico} no tiene peso válido registrado.`);
      return;
    }

    try {
      await axios.post(`${API}/ventas`, {
        cliente_id: Number(clienteId),
        tipo_venta: tipoVenta,
        animales: seleccion.map((id) => ({
          animal_id: Number(id),
          precio_kg: Number(precioKgVenta)
        }))
      });

      setSeleccion([]);
      setPrecioKgVenta('');
      setCliente('');
      setMensaje(`Venta de ${etiqueta} registrada correctamente.`);

      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || `Error registrando venta de ${etiqueta}.`);
    }
  };

  const venderAbasto = async () => {
    await venderPrecioFijo({
      clienteId: abastoCliente,
      setCliente: setAbastoCliente,
      precio: precioFijoAbasto,
      setPrecio: setPrecioFijoAbasto,
      seleccion: seleccionados,
      setSeleccion: setSeleccionados,
      animalesValidos: animalesAbasto,
      tipoVenta: 'abasto',
      etiqueta: 'abasto'
    });
  };

  const venderPie = async () => {
    await venderPrecioFijo({
      clienteId: pieCliente,
      setCliente: setPieCliente,
      precio: precioFijo,
      setPrecio: setPrecioFijo,
      seleccion: pieSeleccionados,
      setSeleccion: setPieSeleccionados,
      animalesValidos: animalesPie,
      tipoVenta: 'pie_cria',
      etiqueta: 'pie de cría'
    });
  };

  const venderEngorda = async () => {
    await venderPorKg({
      clienteId: engordaCliente,
      setCliente: setEngordaCliente,
      precioKgVenta: precioKgEngorda,
      setPrecioKgVenta: setPrecioKgEngorda,
      seleccion: engordaSeleccionados,
      setSeleccion: setEngordaSeleccionados,
      animalesValidos: animalesEngorda,
      tipoVenta: 'engorda',
      etiqueta: 'engorda'
    });
  };

  const venderDescarte = async () => {
    await venderPorKg({
      clienteId: descarteCliente,
      setCliente: setDescarteCliente,
      precioKgVenta: precioKgDescarte,
      setPrecioKgVenta: setPrecioKgDescarte,
      seleccion: descarteSeleccionados,
      setSeleccion: setDescarteSeleccionados,
      animalesValidos: animalesDescarte,
      tipoVenta: 'descarte',
      etiqueta: 'descarte'
    });
  };

  const abrirReporteVentas = () => {
    window.open(`${API}/reportes/ventas`, '_blank');
  };

  const obtenerDetallesVenta = (venta) => {
    return venta.detalleAnimales || venta.detalle_animales || [];
  };

  const styles = {
    container: {
      padding: '20px 30px',
      background: '#f8fafc',
      minHeight: '100vh',
      color: '#0f172a'
    },
    card: {
      background: '#fff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 6px 24px rgba(15,23,42,.08)',
      marginBottom: '20px'
    },
    btn: (active = false) => ({
      padding: '10px 16px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      background: active ? '#2563eb' : '#dbeafe',
      color: active ? '#fff' : '#1e3a8a',
      fontWeight: 700
    }),
    dangerBtn: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      background: '#dc2626',
      color: '#fff',
      fontWeight: 700
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      minWidth: '200px'
    },
    th: {
      padding: '12px',
      background: '#e2e8f0',
      textAlign: 'left',
      fontSize: '14px'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '14px'
    },
    badgeOk: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '999px',
      background: '#dcfce7',
      color: '#166534',
      fontWeight: 700,
      fontSize: '12px'
    },
    badgeBad: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '999px',
      background: '#fee2e2',
      color: '#991b1b',
      fontWeight: 700,
      fontSize: '12px'
    }
  };

  const renderTablaVenta = ({
    titulo,
    descripcion,
    cliente,
    setCliente,
    precio,
    setPrecio,
    placeholderPrecio,
    animalesVenta,
    seleccion,
    setSeleccion,
    tipoCalculo,
    subtotal,
    iva,
    total,
    onVender,
    textoVacio,
    mostrarBotonSeleccionarTodos = false
  }) => (
    <div style={styles.card}>
      <h2>{titulo}</h2>

      {descripcion && (
        <p style={{ color: '#475569', marginTop: '-6px' }}>{descripcion}</p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          style={styles.input}
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        >
          <option value="">Cliente</option>
          {clientes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="number"
          min="0"
          step="0.01"
          placeholder={placeholderPrecio}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />

        {mostrarBotonSeleccionarTodos && (
          <>
            <button
              style={styles.btn(false)}
              type="button"
              onClick={() => setSeleccion(animalesVenta.map((animal) => animal.id))}
            >
              Seleccionar todos para lote
            </button>

            <button
              style={styles.btn(false)}
              type="button"
              onClick={() => setSeleccion([])}
            >
              Limpiar selección
            </button>
          </>
        )}
      </div>

      <p style={{ color: '#475569', fontWeight: 700 }}>
        Animales seleccionados: {seleccion.length} de {animalesVenta.length}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={styles.th}></th>
            <th style={styles.th}>Identificador</th>
            <th style={styles.th}>Sexo</th>
            <th style={styles.th}>Estado</th>
            <th style={styles.th}>Etapa</th>
            <th style={styles.th}>Clasificación</th>
            <th style={styles.th}>Peso</th>
            <th style={styles.th}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {animalesVenta.map((animal) => {
            const pesoAnimal = obtenerPesoAnimal(animal);

            const subtotalAnimal = tipoCalculo === 'kg'
              ? pesoAnimal * Number(precio || 0)
              : Number(precio || 0);

            return (
              <tr key={animal.id}>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={seleccion.includes(animal.id)}
                    onChange={() => toggle(animal.id, setSeleccion, seleccion)}
                  />
                </td>
                <td style={styles.td}>{animal.identificador_unico}</td>
                <td style={styles.td}>{animal.sexo || 'N/A'}</td>
                <td style={styles.td}>
                  <span style={styles.badgeOk}>{animal.estado || 'activo'}</span>
                </td>
                <td style={styles.td}>{animal.etapa_actual || 'N/A'}</td>
                <td style={styles.td}>{animal.clasificacion || 'N/A'}</td>
                <td style={styles.td}>{Number(pesoAnimal || 0).toFixed(2)} kg</td>
                <td style={styles.td}>{formatoMoneda(subtotalAnimal)}</td>
              </tr>
            );
          })}

          {animalesVenta.length === 0 && (
            <tr>
              <td style={styles.td} colSpan="8">
                {textoVacio}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', fontWeight: 800 }}>
        Subtotal {formatoMoneda(subtotal)} | IVA {formatoMoneda(iva)} | Total {formatoMoneda(total)}
      </div>

      <button style={{ ...styles.btn(true), marginTop: '15px' }} onClick={onVender}>
        Registrar venta
      </button>
    </div>
  );

  if (loading) {
    return <div style={styles.container}>Cargando comercialización...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>
        💰 Comercialización
      </h1>

      <p style={{ color: '#475569', marginTop: 0, marginBottom: '20px' }}>
        Ventas blindadas: el frontend oculta animales muertos, vendidos o dados de baja.
        Abasto y pie de cría se venden por precio fijo; engorda y descarte se venden por kilo.
      </p>

      {mensaje && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '16px',
          fontWeight: 700
        }}>
          {mensaje}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button style={styles.btn(tab === 'clientes')} onClick={() => setTab('clientes')}>
          CLIENTES
        </button>
        <button style={styles.btn(tab === 'abasto')} onClick={() => setTab('abasto')}>
          ABASTO
        </button>
        <button style={styles.btn(tab === 'pie')} onClick={() => setTab('pie')}>
          PIE DE CRÍA
        </button>
        <button style={styles.btn(tab === 'engorda')} onClick={() => setTab('engorda')}>
          ENGORDA
        </button>
        <button style={styles.btn(tab === 'descarte')} onClick={() => setTab('descarte')}>
          DESCARTE
        </button>
        <button style={styles.btn(tab === 'historial')} onClick={() => setTab('historial')}>
          HISTORIAL
        </button>
        <button style={styles.btn(tab === 'analytics')} onClick={() => setTab('analytics')}>
          ANALYTICS
        </button>
        <button style={{ ...styles.btn(true), background: '#166534' }} onClick={abrirReporteVentas}>
          Descargar PDF ventas
        </button>
        <button style={{ ...styles.btn(true), background: '#0f766e' }} onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Animales disponibles</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesDisponibles.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Bloqueados</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesBloqueados.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Abasto vendible</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesAbasto.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Pie de cría vendible</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesPie.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Engorda vendible</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesEngorda.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Descarte vendible</h3>
          <p style={{ fontSize: '28px', fontWeight: 800 }}>{animalesDescarte.length}</p>
        </div>
      </div>

      {tab === 'clientes' && (
        <div style={styles.card}>
          <h2>Clientes</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            <input
              style={styles.input}
              placeholder="Nombre"
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Teléfono"
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Email"
              value={clienteForm.email}
              onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Dirección"
              value={clienteForm.direccion}
              onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
            />

            <select
              style={styles.input}
              value={clienteForm.tipo_cliente}
              onChange={(e) => setClienteForm({ ...clienteForm, tipo_cliente: e.target.value })}
            >
              <option value="abasto">Abasto</option>
              <option value="pie_cria">Pie de cría</option>
              <option value="engorda">Engorda</option>
              <option value="descarte">Descarte</option>
              <option value="distribuidor">Distribuidor</option>
              <option value="otro">Otro</option>
            </select>

            <input
              style={styles.input}
              placeholder="Notas"
              value={clienteForm.notas}
              onChange={(e) => setClienteForm({ ...clienteForm, notas: e.target.value })}
            />
          </div>

          <button style={{ ...styles.btn(true), marginTop: '15px' }} onClick={crearCliente}>
            Crear cliente
          </button>

          <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Ventas completadas</th>
                <th style={styles.th}>Total comprado</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td style={styles.td}>{cliente.nombre}</td>
                  <td style={styles.td}>{cliente.tipo_cliente}</td>
                  <td style={styles.td}>{cliente.telefono || 'N/A'}</td>
                  <td style={styles.td}>{cliente.ventas_count || 0}</td>
                  <td style={styles.td}>{formatoMoneda(cliente.ventas_sum_total || 0)}</td>
                  <td style={styles.td}>
                    <button style={styles.dangerBtn} onClick={() => eliminarCliente(cliente.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="6">No hay clientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'abasto' &&
      renderTablaVenta({
        titulo: "Venta Abasto",
        descripcion:
          "Abasto se vende por precio fijo por animal. Puedes seleccionar todos para vender por lote.",
        cliente: abastoCliente,
        setCliente: setAbastoCliente,
        precio: precioFijoAbasto,
        setPrecio: setPrecioFijoAbasto,
        placeholderPrecio: "Precio fijo por animal",
        animalesVenta: animalesAbasto,
        seleccion: seleccionados,
        setSeleccion: setSeleccionados,
        tipoCalculo: "fijo",
        subtotal: subtotalAbasto,
        iva: ivaAbasto,
        total: totalAbasto,
        onVender: venderAbasto,
        textoVacio: "No hay animales de abasto disponibles para venta.",
        mostrarBotonSeleccionarTodos: true,
      })}

      {tab === 'pie' &&
        renderTablaVenta({
          titulo: "Pie de Cría",
          descripcion: "Pie de cría se vende por precio fijo por animal.",
          cliente: pieCliente,
          setCliente: setPieCliente,
          precio: precioFijo,
          setPrecio: setPrecioFijo,
          placeholderPrecio: "Precio fijo por animal",
          animalesVenta: animalesPie,
          seleccion: pieSeleccionados,
          setSeleccion: setPieSeleccionados,
          tipoCalculo: "fijo",
          subtotal: subtotalPie,
          iva: ivaPie,
          total: totalPie,
          onVender: venderPie,
          textoVacio: "No hay animales de pie de cría disponibles para venta.",
        })}

      {tab === 'engorda' &&
        renderTablaVenta({
          titulo: "Engorda",
          descripcion:
            "Engorda se vende por kilo. El sistema multiplica peso registrado por precio por kg.",
          cliente: engordaCliente,
          setCliente: setEngordaCliente,
          precio: precioKgEngorda,
          setPrecio: setPrecioKgEngorda,
          placeholderPrecio: "Precio por kg",
          animalesVenta: animalesEngorda,
          seleccion: engordaSeleccionados,
          setSeleccion: setEngordaSeleccionados,
          tipoCalculo: "kg",
          subtotal: subtotalEngorda,
          iva: ivaEngorda,
          total: totalEngorda,
          onVender: venderEngorda,
          textoVacio: "No hay animales de engorda disponibles para venta.",
        })}

      {tab === 'descarte' &&
        renderTablaVenta({
          titulo: "Descarte",
          descripcion:
            "Descarte se vende por kilo. Se consideran animales marcados como descarte o descartados.",
          cliente: descarteCliente,
          setCliente: setDescarteCliente,
          precio: precioKgDescarte,
          setPrecio: setPrecioKgDescarte,
          placeholderPrecio: "Precio por kg",
          animalesVenta: animalesDescarte,
          seleccion: descarteSeleccionados,
          setSeleccion: setDescarteSeleccionados,
          tipoCalculo: "kg",
          subtotal: subtotalDescarte,
          iva: ivaDescarte,
          total: totalDescarte,
          onVender: venderDescarte,
          textoVacio: "No hay animales de descarte disponibles para venta.",
        })}

      {tab === 'historial' && (
        <div style={styles.card}>
          <h2>Historial de ventas</h2>

          {historial.map((venta) => {
            const detalles = obtenerDetallesVenta(venta);

            return (
              <div
                key={venta.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <strong>{venta.folio || `VENTA-${venta.id}`}</strong>
                  <span>Cliente: {venta.cliente?.nombre || 'N/A'}</span>
                  <span>Tipo: {etiquetaTipoVenta(venta.tipo_venta)}</span>
                  <span>Estado: {venta.estado}</span>
                  <span>Total: {formatoMoneda(venta.total)}</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Animal</th>
                      <th style={styles.th}>Peso</th>
                      <th style={styles.th}>Precio kg</th>
                      <th style={styles.th}>Precio fijo</th>
                      <th style={styles.th}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle) => (
                      <tr key={detalle.id}>
                        <td style={styles.td}>
                          {detalle.animal?.identificador_unico || 'Animal no disponible'}
                        </td>
                        <td style={styles.td}>
                          {detalle.peso_individual !== null && detalle.peso_individual !== undefined
                            ? `${Number(detalle.peso_individual).toFixed(2)} kg`
                            : 'N/A'}
                        </td>
                        <td style={styles.td}>
                          {detalle.precio_kg !== null && detalle.precio_kg !== undefined
                            ? formatoMoneda(detalle.precio_kg)
                            : '-'}
                        </td>
                        <td style={styles.td}>
                          {detalle.precio_fijo !== null && detalle.precio_fijo !== undefined
                            ? formatoMoneda(detalle.precio_fijo)
                            : '-'}
                        </td>
                        <td style={styles.td}>
                          {formatoMoneda(detalle.subtotal_individual)}
                        </td>
                      </tr>
                    ))}

                    {detalles.length === 0 && (
                      <tr>
                        <td style={styles.td} colSpan="5">
                          Esta venta no tiene animales asociados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}

          {historial.length === 0 && (
            <p>No hay ventas registradas.</p>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px'
          }}>
            <div style={styles.card}>
              <h3>Total ventas completadas</h3>
              <p style={{ fontSize: '28px', fontWeight: 800 }}>{resumen.total_ventas || 0}</p>
            </div>

            <div style={styles.card}>
              <h3>Ingresos completados</h3>
              <p style={{ fontSize: '28px', fontWeight: 800 }}>
                {formatoMoneda(resumen.ingresos_totales || 0)}
              </p>
            </div>

            <div style={styles.card}>
              <h3>Promedio por venta</h3>
              <p style={{ fontSize: '28px', fontWeight: 800 }}>
                {formatoMoneda(resumen.promedio_por_venta || 0)}
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <h3>Ventas por tipo</h3>

            {tipos.map((tipo, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <span>{etiquetaTipoVenta(tipo.tipo_venta)}</span>
                <strong>{tipo.cantidad} ventas | {formatoMoneda(tipo.total)}</strong>
              </div>
            ))}

            {tipos.length === 0 && (
              <p>No hay ventas completadas para graficar.</p>
            )}
          </div>

          <div style={styles.card}>
            <h3>Animales bloqueados para venta</h3>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Identificador</th>
                  <th style={styles.th}>Sexo</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Clasificación</th>
                  <th style={styles.th}>Peso</th>
                </tr>
              </thead>
              <tbody>
                {animalesBloqueados.map((animal) => (
                  <tr key={animal.id}>
                    <td style={styles.td}>{animal.identificador_unico}</td>
                    <td style={styles.td}>{animal.sexo || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeBad}>{animal.estado || 'N/A'}</span>
                    </td>
                    <td style={styles.td}>{animal.clasificacion || 'N/A'}</td>
                    <td style={styles.td}>{Number(animal.peso || 0).toFixed(2)} kg</td>
                  </tr>
                ))}

                {animalesBloqueados.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan="5">
                      No hay animales bloqueados por estado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
