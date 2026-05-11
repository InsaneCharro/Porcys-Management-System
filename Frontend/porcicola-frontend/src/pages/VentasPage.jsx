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

  const [clienteForm, setClienteForm] = useState({ nombre:'', telefono:'', email:'', direccion:'', tipo_cliente:'abasto', notas:'' });
  const [abastoCliente, setAbastoCliente] = useState('');
  const [precioKg, setPrecioKg] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [pieCliente, setPieCliente] = useState('');
  const [pieSeleccionados, setPieSeleccionados] = useState([]);
  const [precioFijo, setPrecioFijo] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [a,c,h,r,t] = await Promise.all([
        axios.get(`${API}/animales`),
        axios.get(`${API}/clientes`),
        axios.get(`${API}/ventas/historial`),
        axios.get(`${API}/ventas/resumen`),
        axios.get(`${API}/ventas/tipos`)
      ]);
      setAnimales(a.data || []);
      setClientes(c.data || []);
      setHistorial(h.data || []);
      setResumen(r.data || {});
      setTipos(t.data || []);
    } catch (e) {
      console.error(e);
      alert('Error cargando ventas');
    } finally {
      setLoading(false);
    }
  };

  const animalesAbasto = animales.filter(
    animal =>
      animal.estado !== "muerto" &&
      animal.estado !== "vendido" &&
      animal.clasificacion === "abasto"
  );

  const animalesPie = animales.filter(
    animal =>
      animal.estado !== "muerto" &&
      animal.estado !== "vendido" &&
      animal.clasificacion === "pie de cría"
  );

  const toggle = (id, setter, arr) => setter(arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);

  const subtotalAbasto = animalesAbasto.filter(a => seleccionados.includes(a.id)).reduce((acc,a)=>acc+(Number(a.peso)*Number(precioKg||0)),0);
  const ivaAbasto = subtotalAbasto*0.16;
  const totalAbasto = subtotalAbasto+ivaAbasto;

  const subtotalPie = pieSeleccionados.length * Number(precioFijo || 0);
  const ivaPie = subtotalPie * 0.16;
  const totalPie = subtotalPie + ivaPie;

  const crearCliente = async () => {
    try {
      await axios.post(`${API}/clientes`, clienteForm);
      setClienteForm({ nombre:'', telefono:'', email:'', direccion:'', tipo_cliente:'abasto', notas:'' });
      cargarDatos();
    } catch (e) {
      alert('Error creando cliente');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await axios.delete(`${API}/clientes/${id}`);
      cargarDatos();
    } catch {
      alert('Error eliminando cliente');
    }
  };

  const venderAbasto = async () => {
    if (!abastoCliente || !precioKg || seleccionados.length === 0) return alert('Completa datos');
    try {
      await axios.post(`${API}/ventas`, {
        cliente_id: abastoCliente,
        tipo_venta: 'abasto',
        animales: seleccionados.map(id => ({ animal_id: id, precio_kg: Number(precioKg) }))
      });
      setSeleccionados([]); setPrecioKg(''); setAbastoCliente('');
      cargarDatos();
    } catch (e) {
      alert(e.response?.data?.error || 'Error venta abasto');
    }
  };

  const venderPie = async () => {
    if (!pieCliente || !precioFijo || pieSeleccionados.length === 0) {
      return alert('Completa datos');
    }

    try {
      const payload = {
        cliente_id: Number(pieCliente),
        tipo_venta: 'pie_cria',
        animales: pieSeleccionados.map(id => ({
          animal_id: Number(id),
          precio_fijo: Number(precioFijo)
        }))
      };

      console.log("PAYLOAD PIE:", payload);

      await axios.post(`${API}/ventas`, payload);

      setPieSeleccionados([]);
      setPrecioFijo('');
      setPieCliente('');

      cargarDatos();

      alert('Venta pie de cría registrada correctamente');

    } catch (error) {
      console.error("ERROR PIE:", error.response?.data);
      alert(JSON.stringify(error.response?.data));
    }
  };

  const styles = {
    container:{padding:'20px 30px',background:'#f8fafc',minHeight:'100vh',color:'#0f172a'},
    card:{background:'#fff',padding:'24px',borderRadius:'16px',boxShadow:'0 6px 24px rgba(15,23,42,.08)',marginBottom:'20px'},
    btn:(active=false)=>({padding:'10px 16px',border:'none',borderRadius:'10px',cursor:'pointer',background:active?'#2563eb':'#dbeafe',color:active?'#fff':'#1e3a8a',fontWeight:700}),
    input:{padding:'10px 12px',border:'1px solid #cbd5e1',borderRadius:'10px',minWidth:'200px'},
    th:{padding:'12px',background:'#e2e8f0',textAlign:'left'},
    td:{padding:'12px',borderBottom:'1px solid #e2e8f0'}
  };

  if (loading) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <h1 style={{fontSize:'36px',fontWeight:700,marginBottom:'20px'}}>💰 Comercialización</h1>
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'20px'}}>
        <button style={styles.btn(tab==='clientes')} onClick={()=>setTab('clientes')}>CLIENTES</button>
        <button style={styles.btn(tab==='abasto')} onClick={()=>setTab('abasto')}>ABASTO</button>
        <button style={styles.btn(tab==='pie')} onClick={()=>setTab('pie')}>PIE DE CRÍA</button>
        <button style={styles.btn(tab==='historial')} onClick={()=>setTab('historial')}>HISTORIAL</button>
        <button style={styles.btn(tab==='analytics')} onClick={()=>setTab('analytics')}>ANALYTICS</button>
      </div>

      {tab==='clientes' && <div style={styles.card}>
        <h2>Clientes</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'10px'}}>
          <input style={styles.input} placeholder='Nombre' value={clienteForm.nombre} onChange={e=>setClienteForm({...clienteForm,nombre:e.target.value})}/>
          <input style={styles.input} placeholder='Teléfono' value={clienteForm.telefono} onChange={e=>setClienteForm({...clienteForm,telefono:e.target.value})}/>
          <input style={styles.input} placeholder='Email' value={clienteForm.email} onChange={e=>setClienteForm({...clienteForm,email:e.target.value})}/>
          <input style={styles.input} placeholder='Dirección' value={clienteForm.direccion} onChange={e=>setClienteForm({...clienteForm,direccion:e.target.value})}/>
        </div>
        <button style={{...styles.btn(true),marginTop:'15px'}} onClick={crearCliente}>Crear cliente</button>
        <table style={{width:'100%',marginTop:'20px',borderCollapse:'collapse'}}><thead><tr><th style={styles.th}>Nombre</th><th style={styles.th}>Tipo</th><th style={styles.th}>Teléfono</th><th style={styles.th}>Acción</th></tr></thead><tbody>{clientes.map(c=><tr key={c.id}><td style={styles.td}>{c.nombre}</td><td style={styles.td}>{c.tipo_cliente}</td><td style={styles.td}>{c.telefono}</td><td style={styles.td}><button style={{...styles.btn(true),background:'#dc2626'}} onClick={()=>eliminarCliente(c.id)}>Eliminar</button></td></tr>)}</tbody></table>
      </div>}

      {tab==='abasto' && <div style={styles.card}>
        <h2>Venta Abasto</h2>
        <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
          <select style={styles.input} value={abastoCliente} onChange={e=>setAbastoCliente(e.target.value)}><option value=''>Cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
          <input style={styles.input} type='number' placeholder='Precio por kg' value={precioKg} onChange={e=>setPrecioKg(e.target.value)} />
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={styles.th}></th><th style={styles.th}>ID</th><th style={styles.th}>Peso</th></tr></thead><tbody>{animalesAbasto.map(a=><tr key={a.id}><td style={styles.td}><input type='checkbox' checked={seleccionados.includes(a.id)} onChange={()=>toggle(a.id,setSeleccionados,seleccionados)} /></td><td style={styles.td}>{a.identificador_unico}</td><td style={styles.td}>{a.peso} kg</td></tr>)}</tbody></table>
        <div style={{marginTop:'20px',fontWeight:700}}>Subtotal ${subtotalAbasto.toFixed(2)} | IVA ${ivaAbasto.toFixed(2)} | Total ${totalAbasto.toFixed(2)}</div>
        <button style={{...styles.btn(true),marginTop:'15px'}} onClick={venderAbasto}>Registrar venta</button>
      </div>}

      {tab==='pie' && <div style={styles.card}>
        <h2>Pie de Cría</h2>
        <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
          <select style={styles.input} value={pieCliente} onChange={e=>setPieCliente(e.target.value)}><option value=''>Cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
          <input style={styles.input} type='number' placeholder='Precio fijo por animal' value={precioFijo} onChange={e=>setPrecioFijo(e.target.value)} />
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={styles.th}></th><th style={styles.th}>ID</th><th style={styles.th}>Peso</th></tr></thead><tbody>{animalesPie.map(a=><tr key={a.id}><td style={styles.td}><input type='checkbox' checked={pieSeleccionados.includes(a.id)} onChange={()=>toggle(a.id,setPieSeleccionados,pieSeleccionados)} /></td><td style={styles.td}>{a.identificador_unico}</td><td style={styles.td}>{a.peso} kg</td></tr>)}</tbody></table>
        <div style={{marginTop:'20px',fontWeight:700}}>Subtotal ${subtotalPie.toFixed(2)} | IVA ${ivaPie.toFixed(2)} | Total ${totalPie.toFixed(2)}</div>
        <button style={{...styles.btn(true),marginTop:'15px'}} onClick={venderPie}>Registrar venta</button>
      </div>}

      {tab==='historial' && <div style={styles.card}><h2>Historial</h2>{historial.map(v=><div key={v.id} style={{padding:'12px',border:'1px solid #e2e8f0',borderRadius:'10px',marginBottom:'10px'}}>{v.folio} | {v.cliente?.nombre} | {v.tipo_venta} | ${Number(v.total).toFixed(2)}</div>)}</div>}

      {tab==='analytics' && <div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'15px'}}><div style={styles.card}><h3>Total ventas</h3><p>{resumen.total_ventas||0}</p></div><div style={styles.card}><h3>Ingresos</h3><p>${Number(resumen.ingresos_totales||0).toFixed(2)}</p></div></div><div style={styles.card}><h3>Ventas por tipo</h3>{tipos.map((t,i)=><div key={i}>{t.tipo_venta}: {t.cantidad}</div>)}</div></div>}
    </div>
  );
}
