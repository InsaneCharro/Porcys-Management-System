import "../styles/dashboard.css";

export default function Reportes() {

  const descargarVentas = () => {
    window.open(
      "http://127.0.0.1:8000/api/reportes/ventas",
      "_blank"
    );
  };

  const descargarInventario = () => {
    window.open(
        "http://127.0.0.1:8000/api/reportes/inventario",
        "_blank"
    );
    };

    const descargarMuertes = () => {
        window.open(
            "http://127.0.0.1:8000/api/reportes/muertes",
            "_blank"
        );
    };

    const descargarSanitario = () => {
        window.open(
            "http://127.0.0.1:8000/api/reportes/sanitario",
            "_blank"
        );
    };

    const descargarVentasExcel = () => {
      window.open(
        "http://127.0.0.1:8000/api/reportes/ventas-excel",
        "_blank"
      );
    };

  return (
    <div className="container">
      <h1 className="title">📄 Reportes PORCYS</h1>

      <div className="cards">

        <div className="card kpi-card">
          <h3>📄 Reporte de ventas</h3>
          <p>Descargar historial completo de ventas</p>

          <button
            className="btn btn-success"
            onClick={descargarVentas}
          >
            Descargar PDF
          </button>
        </div>

        <div className="card kpi-card">
            <h3>📦 Reporte de inventario</h3>
            <p>Descargar inventario actual de alimentos</p>

            <button
                className="btn btn-primary"
                onClick={descargarInventario}
            >
                Descargar PDF
            </button>
        </div>

        <div className="card kpi-card">
            <h3>💀 Reporte de bajas</h3>
            <p>Descargar historial de bajas y mortalidad</p>

            <button
                className="btn btn-danger"
                onClick={descargarMuertes}
            >
                Descargar PDF
            </button>
        </div>

        <div className="card kpi-card">
            <h3>💊 Reporte sanitario</h3>
            <p>Descargar historial médico de animales</p>

            <button
                className="btn"
                onClick={descargarSanitario}
                style={{ background: "#6A1B9A", color: "white" }}
            >
                Descargar PDF
            </button>
        </div>

        <div className="card kpi-card">
          <h3>📊 Excel de ventas</h3>
          <p>Exportar ventas en formato Excel (.xlsx)</p>

          <button
            className="btn"
            onClick={descargarVentasExcel}
            style={{ background: "#2E7D32", color: "white" }}
          >
            Exportar Excel
          </button>
        </div>

      </div>
    </div>
  );
}