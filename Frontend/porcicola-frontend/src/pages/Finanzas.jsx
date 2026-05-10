import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function Finanzas() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [data, setData] = useState(null);

  const cargarResumen = async () => {
    try {
      const response = await axios.get(
        'http://127.0.0.1:8000/api/finanzas/resumen'
      );

      setData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const ejecutarConsumo = async () => {
    try {
      setLoading(true);
      setMensaje('');

      const response = await axios.post(
        'http://127.0.0.1:8000/api/finanzas/consumo-diario'
      );

      setMensaje(response.data.message);

      await cargarResumen();
    } catch (error) {
      console.error(error);
      setMensaje('Error al registrar consumo diario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  if (!data) {
    return <div style={{ padding: '30px' }}>Cargando...</div>;
  }

  const datosGrafica = data?.historial
    ? Object.values(
        data.historial.reduce((acc, item) => {
          const fecha = new Date(item.created_at).toLocaleDateString('es-MX');

          if (!acc[fecha]) {
            acc[fecha] = {
              fecha,
              gasto: 0
            };
          }

          acc[fecha].gasto += Number(item.costo_total);

          return acc;
        }, {})
      )
    : [];

  return (
    <div style={{ padding: '30px', color: 'white' }}>
      <h1 style={{ marginBottom: '30px' }}>
        💰 Módulo Financiero
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <Card titulo="💸 Gasto de hoy" valor={`MXN $${Number(data.gasto_hoy).toLocaleString()}`} />
        <Card titulo="📈 Gasto acumulado" valor={`MXN $${Number(data.gasto_total_alimento).toLocaleString()}`} />
        <Card titulo="📦 Valor inventario" valor={`MXN $${Number(data.valor_inventario).toLocaleString()}`} />
        <Card titulo="🐷 Costo promedio/cerdo" valor={`MXN $${Number(data.costo_promedio_cerdo).toLocaleString()}`} />
      </div>

      <div
        style={{
          background: '#1f2937',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
        }}
      >
        <h2>Consumo automático</h2>

        <button
          onClick={ejecutarConsumo}
          disabled={loading}
          style={{
            padding: '12px 20px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            marginTop: '15px',
          }}
        >
          {loading ? 'Procesando...' : 'Ejecutar consumo diario'}
        </button>
        

        {mensaje && (
          <p style={{ color: '#10b981', marginTop: '15px' }}>
            {mensaje}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="http://127.0.0.1:8000/api/finanzas/pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#dc2626',
              color: 'white',
              padding: '12px 22px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: '0.3s',
            }}
          >
            📄 Exportar PDF
          </a>

          <a
            href="http://127.0.0.1:8000/api/finanzas/excel"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#16a34a',
              color: 'white',
              padding: '12px 22px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: '0.3s',
            }}
          >
            📊 Exportar Excel
          </a>
        </div>

      </div>
      

      

      <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          📈 Tendencia de gastos
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={datosGrafica}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              dataKey="fecha"
              stroke="#cbd5e1"
            />

            <YAxis
              stroke="#cbd5e1"
            />

            <Tooltip
              formatter={(value) => [
                `MXN $${Number(value).toFixed(2)}`,
                'Gasto'
              ]}
            />

            <Line
              type="monotone"
              dataKey="gasto"
              stroke="#8b5cf6"
              strokeWidth={4}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          background: '#1f2937',
          padding: '20px',
          borderRadius: '15px',
        }}
      >
        <h2>Historial financiero</h2>

        <table
          style={{
            width: '100%',
            marginTop: '20px',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: '12px' }}>Producto</th>
              <th style={{ padding: '12px' }}>Cantidad (kg)</th>
              <th style={{ padding: '12px' }}>Costo unitario</th>
              <th style={{ padding: '12px' }}>Total</th>
              <th style={{ padding: '12px' }}>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {data?.historial?.map((item) => (
              <tr key={item.id} className="text-center border-b border-slate-700">
                <td className="py-3">{item.nombre_producto}</td>

                <td className="py-3">
                  {Number(item.cantidad).toFixed(3)}
                </td>

                <td className="py-3">
                  MXN ${Number(item.costo_unitario).toFixed(2)}
                </td>

                <td className="py-3">
                  MXN ${Number(item.costo_total).toFixed(2)}
                </td>

                <td className="py-3">
                  {new Date(item.created_at).toLocaleString('es-MX')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ titulo, valor }) {
  return (
    <div
      style={{
        background: '#1f2937',
        padding: '20px',
        borderRadius: '15px',
        textAlign: 'center',
      }}
    >
      <h3>{titulo}</h3>
      <p
        style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          marginTop: '15px',
        }}
      >
        {valor}
      </p>
    </div>
  );
}