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
  const [precioKg, setPrecioKg] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  const [pieCliente, setPieCliente] = useState('');
  const [pieSeleccionados, setPieSeleccionados] = useState([]);
  const [precioFijo, setPrecioFijo] = useState('');

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
    'descartado',
    'descartada',
    'baja',
    'baja sanitaria',
    'sacrificado',
    'sacrificada',
    'sacrificio sanitario'
  ];

  const esAnimalBloqueado = (animal) => {
    const estado = normalizarTexto(animal.estado);
    return estadosBloqueados.includes(estado);
  };

  const esAnimalAbasto = (animal) => {
    return normalizarTexto(animal.clasificacion) === 'abasto';
  };

  const esAnimalPieCria = (animal) => {
    const clasificacion = normalizarTexto(animal.clasificacion);

    return [
      'pie de cria',
      'pie cria',
      'reproductor',
      'reproductora'
    ].includes(clasificacion);
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

      setAnimales(animalesRes.data || []);
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

  const toggle = (id, setter, arreglo) => {
    setter(arreglo.includes(id) ? arreglo.filter((x) => x !== id) : [...arreglo, id]);
  };

  const subtotalAbasto = animalesAbasto
    .filter((animal) => seleccionados.includes(animal.id))
    .reduce((acc, animal) => acc + (Number(animal.peso || 0) * Number(precioKg || 0)), 0);

  const ivaAbasto = subtotalAbasto * 0.16;
  const totalAbasto = subtotalAbasto + ivaAbasto;

  const subtotalPie = pieSeleccionados.length * Number(precioFijo || 0);
  const ivaPie = subtotalPie * 0.16;
  const totalPie = subtotalPie + ivaPie;

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

  const venderAbasto = async () => {
    if (!abastoCliente) {
      alert('Selecciona un cliente.');
      return;
    }

    if (!precioKg || Number(precioKg) <= 0) {
      alert('Captura un precio por kg válido.');
      return;
    }

    if (seleccionados.length === 0) {
      alert('Selecciona al menos un animal de abasto.');
      return;
    }

    const seleccionValidada = animalesAbasto.filter((animal) => seleccionados.includes(animal.id));

    if (seleccionValidada.length !== seleccionados.length) {
      alert('Hay animales seleccionados que ya no están disponibles. Actualiza la página.');
      return;
    }

    try {
      await axios.post(`${API}/ventas`, {
        cliente_id: Number(abastoCliente),
        tipo_venta: 'abasto',
        animales: seleccionados.map((id) => ({
          animal_id: Number(id),
          precio_kg: Number(precioKg)
        }))
      });

      setSeleccionados([]);
      setPrecioKg('');
      setAbastoCliente('');
      setMensaje('Venta de abasto registrada correctamente.');

      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || 'Error registrando venta de abasto.');
    }
  };

  const venderPie = async () => {
    if (!pieCliente) {
      alert('Selecciona un cliente.');
      return;
    }

    if (!precioFijo || Number(precioFijo) <= 0) {
      alert('Captura un precio fijo válido.');
      return;
    }

    if (pieSeleccionados.length === 0) {
      alert('Selecciona al menos un animal de pie de cría.');
      return;
    }

    const seleccionValidada = animalesPie.filter((animal) => pieSeleccionados.includes(animal.id));

    if (seleccionValidada.length !== pieSeleccionados.length) {
      alert('Hay animales seleccionados que ya no están disponibles. Actualiza la página.');
      return;
    }

    try {
      await axios.post(`${API}/ventas`, {
        cliente_id: Number(pieCliente),
        tipo_venta: 'pie_cria',
        animales: pieSeleccionados.map((id) => ({
          animal_id: Number(id),
          precio_fijo: Number(precioFijo)
        }))
      });

      setPieSeleccionados([]);
      setPrecioFijo('');
      setPieCliente('');
      setMensaje('Venta de pie de cría registrada correctamente.');

      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || 'Error registrando venta de pie de cría.');
    }
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

  if (loading) {
    return <div style={styles.container}>Cargando comercialización...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>
        💰 Comercialización
      </h1>

      <p style={{ color: '#475569', marginTop: 0, marginBottom: '20px' }}>
        Ventas blindadas: el frontend oculta animales muertos, vendidos, descartados o dados de baja.
        El backend sigue siendo la validación principal.
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

      {tab === 'abasto' && (
        <div style={styles.card}>
          <h2>Venta Abasto</h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              style={styles.input}
              value={abastoCliente}
              onChange={(e) => setAbastoCliente(e.target.value)}
            >
              <option value="">Cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio por kg"
              value={precioKg}
              onChange={(e) => setPrecioKg(e.target.value)}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}></th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Clasificación</th>
                <th style={styles.th}>Peso</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {animalesAbasto.map((animal) => (
                <tr key={animal.id}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(animal.id)}
                      onChange={() => toggle(animal.id, setSeleccionados, seleccionados)}
                    />
                  </td>
                  <td style={styles.td}>{animal.identificador_unico}</td>
                  <td style={styles.td}>{animal.sexo || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={styles.badgeOk}>{animal.estado || 'activo'}</span>
                  </td>
                  <td style={styles.td}>{animal.clasificacion || 'N/A'}</td>
                  <td style={styles.td}>{Number(animal.peso || 0).toFixed(2)} kg</td>
                  <td style={styles.td}>
                    {formatoMoneda(Number(animal.peso || 0) * Number(precioKg || 0))}
                  </td>
                </tr>
              ))}

              {animalesAbasto.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="7">
                    No hay animales de abasto disponibles para venta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', fontWeight: 800 }}>
            Subtotal {formatoMoneda(subtotalAbasto)} | IVA {formatoMoneda(ivaAbasto)} | Total {formatoMoneda(totalAbasto)}
          </div>

          <button style={{ ...styles.btn(true), marginTop: '15px' }} onClick={venderAbasto}>
            Registrar venta
          </button>
        </div>
      )}

      {tab === 'pie' && (
        <div style={styles.card}>
          <h2>Pie de Cría</h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              style={styles.input}
              value={pieCliente}
              onChange={(e) => setPieCliente(e.target.value)}
            >
              <option value="">Cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio fijo por animal"
              value={precioFijo}
              onChange={(e) => setPrecioFijo(e.target.value)}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}></th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Clasificación</th>
                <th style={styles.th}>Peso</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {animalesPie.map((animal) => (
                <tr key={animal.id}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={pieSeleccionados.includes(animal.id)}
                      onChange={() => toggle(animal.id, setPieSeleccionados, pieSeleccionados)}
                    />
                  </td>
                  <td style={styles.td}>{animal.identificador_unico}</td>
                  <td style={styles.td}>{animal.sexo || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={styles.badgeOk}>{animal.estado || 'activo'}</span>
                  </td>
                  <td style={styles.td}>{animal.clasificacion || 'N/A'}</td>
                  <td style={styles.td}>{Number(animal.peso || 0).toFixed(2)} kg</td>
                  <td style={styles.td}>{formatoMoneda(Number(precioFijo || 0))}</td>
                </tr>
              ))}

              {animalesPie.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="7">
                    No hay animales de pie de cría disponibles para venta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', fontWeight: 800 }}>
            Subtotal {formatoMoneda(subtotalPie)} | IVA {formatoMoneda(ivaPie)} | Total {formatoMoneda(totalPie)}
          </div>

          <button style={{ ...styles.btn(true), marginTop: '15px' }} onClick={venderPie}>
            Registrar venta
          </button>
        </div>
      )}

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
                  <th style={styles.th}>ID</th>
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