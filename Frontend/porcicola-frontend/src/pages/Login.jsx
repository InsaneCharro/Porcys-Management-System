import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@porcys.local",
    password: "Admin12345",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const usuario = await login(form);
      onLogin(usuario);
      navigate("/");
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        "No se pudo iniciar sesión. Verifica que Laravel esté encendido.";

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={enviar}
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src="/logo.png"
            alt="PORCYS"
            style={{
              width: "76px",
              height: "76px",
              objectFit: "contain",
              marginBottom: "8px",
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            PORCYS
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Acceso por rol: administrador, empleado o inversionista.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "16px",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <label
          style={{
            display: "block",
            fontWeight: 800,
            color: "#334155",
            marginBottom: "6px",
          }}
        >
          Correo
        </label>

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={cambiarCampo}
          required
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            marginBottom: "16px",
            fontSize: "15px",
          }}
        />

        <label
          style={{
            display: "block",
            fontWeight: 800,
            color: "#334155",
            marginBottom: "6px",
          }}
        >
          Contraseña
        </label>

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={cambiarCampo}
          required
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            marginBottom: "18px",
            fontSize: "15px",
          }}
        />

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: "100%",
            padding: "13px",
            border: "none",
            borderRadius: "12px",
            background: cargando ? "#94a3b8" : "#2563eb",
            color: "#ffffff",
            fontWeight: 900,
            cursor: cargando ? "not-allowed" : "pointer",
            fontSize: "15px",
          }}
        >
          {cargando ? "Entrando..." : "Iniciar sesión"}
        </button>

        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "#f8fafc",
            borderRadius: "12px",
            color: "#475569",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          <strong>Usuarios de prueba:</strong>
          <br />
          admin@porcys.local / Admin12345
          <br />
          empleado@porcys.local / Empleado12345
          <br />
          inversionista@porcys.local / Inversionista12345
        </div>
      </form>
    </div>
  );
}