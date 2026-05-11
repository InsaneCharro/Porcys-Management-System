import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

export default function Compras() {
  const [tab, setTab] = useState('proveedores');
  const [proveedores, setProveedores] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventarioData, setInventarioData] = useState([]);
  const [medicamentosData, setMedicamentosData] = useState([]);
  const [proveedorForm, setProveedorForm] = useState({
    nombre: '', empresa: '', telefono: '', email: '', tipo_proveedor: 'mixto', activo: true,
  });

  const [solicitudForm, setSolicitudForm] = useState({
    tipo: 'manual',
    motivo: '',
    detalles: [{ categoria: 'alimento', item_id: '', cantidad: '', unidad: '' }],
  });

  const [ordenForm, setOrdenForm] = useState({
    solicitud_compra_id: '', proveedor_id: '', impuestos: 0, observaciones: '', detalles: [],
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [prov, sol, ord, invRes, medRes] = await Promise.all([
        axios.get(`${API}/proveedores`),
        axios.get(`${API}/solicitudes-compra`),
        axios.get(`${API}/ordenes-compra`),
        axios.get(`${API}/inventario`),
        axios.get(`${API}/medicamentos`),
        ]);

      setProveedores(prov.data.data || []);
      setSolicitudes(sol.data.data || []);
      setOrdenes(ord.data.data || []);
      setInventarioData(invRes.data || []);
      setMedicamentosData(medRes.data || []);
    } catch (error) {
      console.error(error);
      alert('Error cargando módulo de compras');
    } finally {
      setLoading(false);
    }
  };

  

  const crearProveedor = async () => {
    try {
      await axios.post(`${API}/proveedores`, proveedorForm);
      setProveedorForm({ nombre: '', empresa: '', telefono: '', email: '', tipo_proveedor: 'mixto', activo: true });
      cargarDatos();
    } catch {
      alert('Error creando proveedor');
    }
  };

  const crearSolicitud = async () => {
    try {
      await axios.post(`${API}/solicitudes-compra`, solicitudForm);
      setSolicitudForm({ tipo: 'manual', motivo: '', detalles: [{ categoria: 'alimento', item_id: '', cantidad: '', unidad: '' }] });
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error creando solicitud');
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.patch(`${API}/solicitudes-compra/${id}/estado`, { estado });
      cargarDatos();
    } catch {
      alert('Error actualizando estado');
    }
  };

  const prepararOrden = (solicitud) => {
  console.log("SOLICITUD COMPLETA:", solicitud);
  console.log("DETALLES:", solicitud.detalles);

  setTab('ordenes');

  setOrdenForm({
    solicitud_compra_id: solicitud.id,
    proveedor_id: '',
    impuestos: 0,
    observaciones: '',
    detalles: solicitud.detalles.map((d) => {
      console.log("DETALLE INDIVIDUAL:", d);

      const item = getItemsPorCategoria(d.categoria).find(
        (x) => x.id == d.item_id
      );

      return {
        categoria: d.categoria,
        item_id: d.item_id,
        cantidad: d.cantidad,
        precio_unitario: item ? getPrecioItem(d.categoria, item) : 0,
      };
    }),
  });
};

    const getItemsPorCategoria = (categoria) => {
        if (categoria === "alimento") {
            return inventarioData || [];
        }

        if (categoria === "medicamento") {
            return medicamentosData || [];
        }

        return [];
        };

    const getNombreItem = (categoria, item) => {
        if (!item) return "Sin nombre";

        if (categoria === "alimento") {
            return item.nombre_producto || "Alimento sin nombre";
        }

        if (categoria === "medicamento") {
            return item.nombre || "Medicamento sin nombre";
        }

        return "Item";
        };

        const getPrecioItem = (categoria, item) => {
    if (!item) return 0;

    if (categoria === "alimento") {
        return parseFloat(
            item.precio_unitario ||
            item.precio ||
            item.costo_unitario ||
            item.precio_compra ||
            0
        );
    }

    if (categoria === "medicamento") {
        return parseFloat(
            item.precio_unitario ||
            item.precio ||
            item.costo_unitario ||
            0
        );
    }

    return 0;
};

  const crearOrden = async () => {
    try {
      console.log("PAYLOAD ORDEN:", ordenForm);
      if (!ordenForm.proveedor_id) {
        alert('Debes seleccionar un proveedor antes de crear la orden');
        return;
      }
      await axios.post(`${API}/ordenes-compra/desde-solicitud`, {
        ...ordenForm,
        impuestos: ivaOrden,
      });
      setOrdenForm({ solicitud_compra_id: '', proveedor_id: '', impuestos: 0, observaciones: '', detalles: [] });
      cargarDatos();
      alert('Orden creada correctamente');
    } catch (error) {
      console.error(error);
      alert('Error creando orden');
    }
  };

  const recibirOrden = async (id) => {
    const confirmar = window.confirm(
      "¿Confirmar recepción de esta orden?"
    );

    if (!confirmar) return;

    try {
      console.log("RECIBIENDO ORDEN:", id);

      await axios.post(`${API}/recepciones-compra`, {
        orden_compra_id: id,
        observaciones: 'Recepción desde frontend',
      });

      alert("Orden recibida correctamente");

      await cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);

      alert(
        error.response?.data?.message ||
        'Error recibiendo orden'
      );
    }
  };

  const actualizarDetalleSolicitud = (index, campo, valor) => {
    const nuevos = [...solicitudForm.detalles];
    nuevos[index][campo] = valor;

    if (campo === "categoria") {
        nuevos[index].item_id = "";
        nuevos[index].unidad = valor === "alimento" ? "kg" : "pieza";
    }

    if (campo === "item_id") {
        const categoria = nuevos[index].categoria;
        const item = getItemsPorCategoria(categoria).find(
        (x) => x.id == valor
        );

        if (item) {
        nuevos[index].unidad =
            categoria === "alimento"
            ? (item.unidad || "kg")
            : "pieza";
        }
    }

    setSolicitudForm({
        ...solicitudForm,
        detalles: nuevos,
    });
    };

  const agregarDetalleSolicitud = () => {
    setSolicitudForm({
      ...solicitudForm,
      detalles: [...solicitudForm.detalles, { categoria: 'alimento', item_id: '', cantidad: '', unidad: 'kg' }],
    });
  };

  const subtotalOrden = (ordenForm?.detalles || []).reduce((acc, item) => {
    const cantidad = parseFloat(item?.cantidad) || 0;
    const precio = parseFloat(item?.precio_unitario) || 0;
    return acc + (cantidad * precio);
  }, 0);

  const ivaOrden = subtotalOrden * 0.16;
  const totalOrden = subtotalOrden + ivaOrden;

  const styles = {
    container: {
        padding: '20px 30px',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        color: '#1e293b',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      marginBottom: '18px',
      color: '#0f172a',
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '25px',
    },
    tabButton: (active) => ({
      padding: '12px 22px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? '#2563eb' : '#dbeafe',
      color: active ? '#ffffff' : '#1e3a8a',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    }),
    card: {
        background: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
        marginTop: '20px',
        marginBottom: '20px',
        boxSizing: 'border-box',
        },
    input: {
      padding: '10px 14px',
      height: '44px',
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      minWidth: '200px',
      fontSize: '15px',
    },
    button: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#2563eb',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '600',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: '#e2e8f0',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e2e8f0',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Compras / Abastecimiento</h1>

      <div style={styles.tabs}>
        {['proveedores', 'solicitudes', 'ordenes'].map((t) => (
          <button key={t} style={styles.tabButton(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p>Cargando...</p>}

      {tab === 'proveedores' && (
        <div style={styles.card}>
          <h2 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '20px' }}>Gestión de proveedores</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input style={styles.input} placeholder='Nombre' value={proveedorForm.nombre} onChange={(e) => setProveedorForm({ ...proveedorForm, nombre: e.target.value })} />
            <input style={styles.input} placeholder='Empresa' value={proveedorForm.empresa} onChange={(e) => setProveedorForm({ ...proveedorForm, empresa: e.target.value })} />
            <input style={styles.input} placeholder='Teléfono' value={proveedorForm.telefono} onChange={(e) => setProveedorForm({ ...proveedorForm, telefono: e.target.value })} />
            <input style={styles.input} placeholder='Email' value={proveedorForm.email} onChange={(e) => setProveedorForm({ ...proveedorForm, email: e.target.value })} />
            <button style={styles.button} onClick={crearProveedor}>Crear proveedor</button>
          </div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Nombre</th><th style={styles.th}>Empresa</th><th style={styles.th}>Tipo</th><th style={styles.th}>Activo</th></tr></thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.nombre}</td>
                  <td style={styles.td}>{p.empresa}</td>
                  <td style={styles.td}>{p.tipo_proveedor}</td>
                  <td style={styles.td}>{p.activo ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'solicitudes' && (
        <div style={styles.card}>
          <h2 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '20px' }}>Solicitudes de compra</h2>
          <input style={{ ...styles.input, marginBottom: '15px' }} placeholder='Motivo de compra' value={solicitudForm.motivo} onChange={(e) => setSolicitudForm({ ...solicitudForm, motivo: e.target.value })} />

          {solicitudForm.detalles.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <select style={styles.input} value={d.categoria} onChange={(e) => actualizarDetalleSolicitud(i, 'categoria', e.target.value)}>
                <option value='alimento'>Alimento</option>
                <option value='medicamento'>Medicamento</option>
              </select>
              <select style={styles.input} value={d.item_id} onChange={(e) => actualizarDetalleSolicitud(i, 'item_id', e.target.value)}>
                <option value=''>Selecciona item</option>
                {getItemsPorCategoria(d.categoria).map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.nombre || item.nombre_producto}
                    </option>
                    ))}
                                </select>
              <input style={styles.input} placeholder='Cantidad' value={d.cantidad} onChange={(e) => actualizarDetalleSolicitud(i, 'cantidad', e.target.value)} />
              <input style={styles.input} placeholder='Unidad' value={d.unidad} onChange={(e) => actualizarDetalleSolicitud(i, 'unidad', e.target.value)} />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button style={styles.button} onClick={agregarDetalleSolicitud}>Agregar item</button>
            <button style={styles.button} onClick={crearSolicitud}>Crear solicitud</button>
          </div>

          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Folio</th><th style={styles.th}>Estado</th><th style={styles.th}>Motivo</th><th style={styles.th}>Acciones</th></tr></thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.folio}</td>
                  <td style={styles.td}>{s.estado}</td>
                  <td style={styles.td}>{s.motivo}</td>
                  <td style={styles.td}>
                    {s.estado === 'pendiente' && <>
                      <button style={styles.button} onClick={() => cambiarEstado(s.id, 'aprobada')}>Aprobar</button>
                      <button style={{ ...styles.button, backgroundColor: '#dc2626', marginLeft: '8px' }} onClick={() => cambiarEstado(s.id, 'rechazada')}>Rechazar</button>
                    </>}
                    {s.estado === 'aprobada' && <button style={styles.button} onClick={() => prepararOrden(s)}>Convertir a orden</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ordenes' && (
        <div style={styles.card}>
          <h2 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '20px' }}>Órdenes de compra</h2>

          {ordenForm.solicitud_compra_id && (
            <div style={{ marginBottom: '25px' }}>
              <h3>Crear orden desde solicitud #{ordenForm.solicitud_compra_id}</h3>
              <select
                required
                value={ordenForm.proveedor_id}
                onChange={(e) =>
                  setOrdenForm({
                    ...ordenForm,
                    proveedor_id: e.target.value,
                  })
                }
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: ordenForm.proveedor_id
                    ? '2px solid #16a34a'
                    : '2px solid #dc2626',
                  backgroundColor: ordenForm.proveedor_id
                    ? '#f0fdf4'
                    : '#fef2f2',
                  color: ordenForm.proveedor_id
                    ? '#166534'
                    : '#991b1b',
                  fontWeight: '700',
                  minWidth: '240px',
                  cursor: 'pointer',
                }}
              >
                <option value="">⚠ SELECCIONA PROVEEDOR (OBLIGATORIO)</option>

                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '15px', marginBottom: '15px', padding: '20px', background: '#dbeafe', borderRadius: '12px', fontWeight: '700', color: '#1e3a8a' }}>
                <div>Subtotal: ${subtotalOrden.toFixed(2)}</div>
                <div>IVA (16%): ${ivaOrden.toFixed(2)}</div>
                <div>Total: ${totalOrden.toFixed(2)}</div>
              </div>

              {ordenForm.detalles.map((d, i) => {
  const item = getItemsPorCategoria(d.categoria).find(
    (x) => x.id == d.item_id
  );

  return (
    <div
      key={i}
      style={{
        marginTop: '10px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <span style={{ minWidth: '220px' }}>
        {item
          ? getNombreItem(d.categoria, item)
          : `${d.categoria} #${d.item_id}`}
      </span>

      <input
        readOnly
        style={{
          ...styles.input,
          backgroundColor: '#f1f5f9',
          width: '120px',
        }}
        value={d.cantidad}
      />

      <input
        readOnly
        style={{
          ...styles.input,
          backgroundColor: '#f1f5f9',
          width: '120px',
        }}
        value={d.precio_unitario}
      />
    </div>
  );
})}

              <div style={{ marginTop: '15px' }}>
                <button style={styles.button} onClick={crearOrden}>Crear orden</button>
              </div>
            </div>
          )}

          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Folio</th><th style={styles.th}>Estado</th><th style={styles.th}>Total</th><th style={styles.th}>Acción</th></tr></thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td style={styles.td}>{o.folio}</td>
                  <td style={styles.td}>{o.estado}</td>
                  <td style={styles.td}>${o.total}</td>
                  <td style={styles.td}>
                    {o.estado === 'emitida' ? (
                      <button
                        style={{
                          ...styles.button,
                          backgroundColor: '#16a34a',
                        }}
                        onClick={() => recibirOrden(o.id)}
                      >
                        Recibir orden
                      </button>
                    ) : (
                      <span
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          fontWeight: '700',
                        }}
                      >
                        ✔ Recibida
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
