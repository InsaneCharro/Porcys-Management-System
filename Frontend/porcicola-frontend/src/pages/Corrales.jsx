import { useEffect, useState } from "react";
import axios from "axios";
import { useRef } from "react";

export default function Corrales() {
  const [corrales, setCorrales] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [draggedAnimal, setDraggedAnimal] = useState(null); // 👈 AQUÍ
  const [corralHover, setCorralHover] = useState(null);
  const [animacion, setAnimacion] = useState(null);
  const [ruta, setRuta] = useState(null);
  const [historial, setHistorial] = useState([]);

  const cargarHistorial = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/movimientos");

      console.log("MOVIMIENTOS RAW:", res.data);

      const formateado = res.data.map(m => ({
        id: m.id,
        animal: m.animal?.identificador_unico || "SIN_ID",
        from: m.corral_origen?.nombre || "Sin origen",
        to: m.corral_destino?.nombre || "Sin destino",
        time: m.created_at, // 🔥 IMPORTANTE
        nuevo: false
      }));

      console.log("FORMATEADO:", formateado);

      setHistorial(formateado);

    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  };

  useEffect(() => {
    cargarCorrales();
  }, []);

  

  useEffect(() => {
  cargarHistorial();
}, []);

  useEffect(() => {
    console.log("🔥 HISTORIAL CAMBIÓ:", historial);
  }, [historial]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistorial(prev => [...prev]); // 🔥 fuerza re-render
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const corralesRef = useRef({});

  const cargarCorrales = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/corrales");
      setCorrales(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Estado inteligente
  const getEstado = (ocupados, capacidad) => {
    if (!capacidad) return { color: "#555", label: "SIN CAPACIDAD" };

    const porcentaje = (ocupados / capacidad) * 100;

    if (ocupados === 0) return { color: "#777", label: "VACÍO" };
    if (porcentaje >= 100) return { color: "red", label: "LLENO" };
    if (porcentaje >= 80) return { color: "orange", label: "CASI LLENO" };
    return { color: "lime", label: "DISPONIBLE" };
  };

  // 🔥 Mover animal
  const moverAnimal = async (animalId, corralId) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/animales/${animalId}/mover-corral`,
        { corral_id: corralId },
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      alert("✅ Animal movido");

      setAnimalSeleccionado(null);
      cargarCorrales();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al mover");
    }
  };

  const handleDragStart = (animal, corral) => {
    setDraggedAnimal({
      ...animal,
      corralOrigenId: corral.id
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necesario para permitir drop
  };
  
 

  const handleDrop = async (corral) => {
    if (!draggedAnimal) return;

    // 🔥 Obtener el animal REAL desde el estado global
    const animalReal = corrales
      .flatMap(c => c.animales || [])
      .find(a => a.identificador_unico === draggedAnimal.identificador_unico);
    const animalDB = corrales
      .flatMap(c => c.animales || [])
      .find(a => a.identificador_unico === animalReal.identificador_unico);    
    if (!animalReal) {
      console.error("❌ Animal no encontrado en corrales");
      return;
    }

    const origenCorral = corrales.find(c => c.id === animalReal.corral_id);

    // 🔴 REGLAS
    if (animalReal.estado === "muerto") {
      alert("❌ No puedes mover un animal muerto");
      return;
    }

    if (animalReal.estado === "descartado") {
      alert("❌ Animal descartado");
      return;
    }

    if (corral.lechones_count >= corral.capacidad) {
      alert("⚠️ Corral lleno");
      return;
    }

    // 🔥 ELEMENTOS DOM
    const origenEl = corralesRef.current[animalReal.corral_id];
    const destinoEl = corralesRef.current[corral.id];

    if (origenEl && destinoEl) {
      const from = getCenter(origenEl);
      const to = getCenter(destinoEl);

      setRuta({ from, to });

      setAnimacion({
        id: animalReal.id,
        from,
        to
      });
    }

    // 🔥 VALIDACIÓN DE ZONAS
    const esMaternidad = zonas.maternidad.includes(corral.nombre);
    const esEngorda = zonas.engorda.includes(corral.nombre);

    const origenZona = zonas.maternidad.includes(origenCorral?.nombre)
      ? "maternidad"
      : "engorda";

    if (origenZona === "maternidad" && esEngorda) {
      alert("⚠️ No puedes mover directo de maternidad a engorda");
      return;
    }

    try {
      const origenNombre = origenCorral?.nombre || "Desconocido";
      const destinoNombre = corral.nombre;

      // 🔄 MOVER EN BACKEND (usar ID REAL)
      await moverAnimal(animalReal.id, corral.id);

      // 🔥 GUARDAR HISTORIAL
      try {
        console.log("ANIMAL REAL:", animalReal);
        console.log("ANIMAL DB:", animalDB);
        console.log("ID QUE ENVÍAS:", animalDB?.id);

        await axios.post("http://127.0.0.1:8000/api/movimientos", {
          animal_id: animalDB?.id, // ✅ ID REAL
          corral_origen_id: origenCorral?.id,
          corral_destino_id: corral.id
        });

      } catch (err) {
        console.error("❌ ERROR GUARDANDO HISTORIAL:", err);
        console.log("RESPUESTA BACKEND:", err.response?.data);
        console.log("ANIMAL KEYS:", Object.keys(animalReal));
      }

      // 🔄 RECARGAR HISTORIAL
      await cargarHistorial();

      // 🔄 RECARGAR CORRALES
      const res = await axios.get("http://127.0.0.1:8000/api/corrales");
      setCorrales(res.data);

    } catch (err) {
      console.error("❌ ERROR COMPLETO:", err);
      alert("Error al mover animal");
    } finally {
      setDraggedAnimal(null);

      setTimeout(() => {
        setAnimacion(null);
        setRuta(null);
      }, 800);
    }
  };

  const layout = {
    "Corral A": { col: 1, row: 1 },
    "Corral B": { col: 2, row: 1 },
    "Corral C": { col: 3, row: 1 },
    "Corral E": { col: 4, row: 1 }
  };

  const zonas = {
    maternidad: ["Corral A", "Corral B"],
    engorda: ["Corral C", "Corral E"]
  };

  const getCenter = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const historialAgrupado = historial.reduce((acc, mov) => {
  const destino = mov.to || "Sin destino";

  if (!acc[destino]) {
    acc[destino] = [];
  }

  acc[destino].push(mov);
  return acc;
}, {});

  const getZonaStyle = (corralNombre) => {
    if (zonas.maternidad.includes(corralNombre)) {
      return {
        color: "#4ade80", // verde
        icon: "🍼",
        bg: "rgba(34,197,94,0.1)"
      };
    }

    if (zonas.engorda.includes(corralNombre)) {
      return {
        color: "#f87171", // rojo
        icon: "🍖",
        bg: "rgba(248,113,113,0.1)"
      };
    }

    return {
      color: "#aaa",
      icon: "📦",
      bg: "#222"
    };
  };

  const tiempoRelativo = (fechaISO) => {
    const ahora = new Date();
    const fecha = new Date(fechaISO);

    const diff = Math.floor((ahora - fecha) / 1000);

    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;

    return `hace ${Math.floor(diff / 3600)} h`;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🐖 Tablero de Corrales</h1>

      {animalSeleccionado && (
        <p style={{ color: "lime", marginBottom: "10px" }}>
          👉 Seleccionado: {animalSeleccionado.identificador_unico} (haz click
          en otro corral)
        </p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)", // 4 columnas fijas
        gridTemplateRows: "repeat(2, 200px)",  // 2 filas
        gap: "20px"
      }}>
        {corrales.map((c) => {
          const ocupados = c.lechones_count ?? 0;
          const estado = getEstado(ocupados, c.capacidad);

          let zonaColor = "#1e1e1e";

          if (zonas.maternidad.includes(c.nombre)) {
            zonaColor = "#1a2e1a"; // verde oscuro
          } else if (zonas.engorda.includes(c.nombre)) {
            zonaColor = "#2e1a1a"; // rojo oscuro
          }

          return (
            <div
              key={c.id}
              ref={(el) => corralesRef.current[c.id] = el}
              onDragOver={(e) => {
                e.preventDefault();
                setCorralHover(c.id);
              }}
              onDragLeave={() => setCorralHover(null)}
              onDrop={() => {
                handleDrop(c);
                setCorralHover(null);
              }}
              style={{
                background: zonaColor,
                padding: "15px",
                borderRadius: "10px",
                minHeight: "150px",
                transition: "all 0.2s ease",
                gridColumn: layout[c.nombre]?.col || "auto",
                gridRow: layout[c.nombre]?.row || "auto",

                // 🔥 BORDE DINÁMICO
                border:
                  corralHover === c.id
                    ? c.lechones_count >= c.capacidad
                      ? "3px solid red"
                      : "3px solid #22c55e"
                    : "1px solid #333",

                // 🔥 EFECTO HOVER
                transform: corralHover === c.id ? "scale(1.03)" : "scale(1)",
              }}
            >
              {/* HEADER */}
              <h3>{c.nombre}</h3>

              <p style={{ fontSize: "10px", color: "#aaa" }}>
                {zonas.maternidad.includes(c.nombre)
                  ? "Maternidad"
                  : zonas.engorda.includes(c.nombre)
                  ? "Engorda"
                  : ""}
              </p>

              {/* OCUPACIÓN */}
              <p style={{ color: estado.color, fontWeight: "bold" }}>
                {ocupados}/{c.capacidad}
              </p>

              {/* ESTADO */}
              <p style={{ fontSize: "12px", color: estado.color }}>
                {estado.label}
              </p>

              {/* ANIMALES */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                }}
              >
                {!c.animales || c.animales.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#777" }}>Vacío</span>
                ) : (
                  c.animales.map((a) => (
                    a && (

                      <span
                      key={a.id}
                      draggable
                      onDragStart={() => handleDragStart(a, c)}
                      style={{
                        background:
                          a.estado === "muerto" ? "#7f1d1d" :
                          a.estado === "descartado" ? "#78350f" :
                          "#333",
                        padding: "5px 8px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        cursor: "grab",
                        transition: "all 0.2s",
                      }}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.opacity = "0.5")
                      }
                      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      🐖 {a?.identificador_unico}
                    </span>

                    )
                  ))
                )}
              </div>

              {/* ALERTA */}
              {ocupados >= c.capacidad && (
                <p
                  style={{
                    marginTop: "10px",
                    color: "red",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  ⚠️ Corral lleno
                </p>
              )}

              
            </div>
          );
        })}

         <div style={{
          gridColumn: "1 / span 4", // ocupa todas las columnas
          gridRow: 2,               // segunda fila
          background: "#111",
          borderRadius: "8px",
          textAlign: "center",
          color: "#555",
          padding: "10px"
        }}>
          🚜 Pasillo de manejo
        </div>

        
      </div>

      {/* 📊 HISTORIAL AGRUPADO */}
      <div style={{
  marginTop: "20px",
  background: "#0a0a0a",
  padding: "15px",
  borderRadius: "10px"
}}>
  <h4 style={{ color: "#aaa", marginBottom: "10px" }}>
    📊 Timeline de movimientos
  </h4>

  {Object.keys(historialAgrupado).length === 0 ? (
    <p style={{ color: "#666" }}>Sin movimientos</p>
  ) : (
    Object.entries(historialAgrupado).map(([corral, movimientos]) => {
      const zona = getZonaStyle(corral);

      return (
        <div key={corral} style={{ marginBottom: "20px" }}>
          
          {/* HEADER CORRAL */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: zona.color,
            fontWeight: "bold"
          }}>
            {zona.icon} {corral}
          </div>

          {/* LÍNEA VERTICAL */}
          <div style={{
            borderLeft: `2px solid ${zona.color}`,
            marginLeft: "10px",
            paddingLeft: "15px",
            marginTop: "10px"
          }}>
            
            {movimientos.map((h, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  color: zona.color,
                  marginLeft: "10px",

                  // 🔥 AQUÍ VA LA ANIMACIÓN
                  opacity: h.nuevo ? 0 : 1,
                  animation: "fadeIn 0.5s forwards"
                }}
              >
                
                {/* DOT */}
                <div style={{
                  width: "8px",
                  height: "8px",
                  background: zona.color,
                  borderRadius: "50%",
                  position: "absolute",
                  left: "-19px",
                  top: "5px"
                }} />

                {/* TEXTO */}
                <div style={{ color: "#ddd", fontSize: "13px" }}>
                  🐖 {h.animal} → {h.to} ({h.time})
                </div>

                <div style={{
                  fontSize: "11px",
                  color: "#777"
                }}>
                  {tiempoRelativo(h.time)}
                </div>

              </div>
            ))}

          </div>
        </div>
      );
    })
  )}
</div>

      

      {animacion && draggedAnimal && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#22c55e",
          padding: "10px 15px",
          borderRadius: "8px",
          color: "white",
          fontWeight: "bold",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)"
        }}>
          🐖 {draggedAnimal?.identificador_unico} movido
        </div>
      )}

      {animacion && (
        <div
          style={{
            position: "fixed",
            left: animacion.from.x,
            top: animacion.from.y,
            transition: "all 0.6s ease-in-out",
            transform: `translate(
              ${animacion.to.x - animacion.from.x}px,
              ${animacion.to.y - animacion.from.y}px
            )`,
            pointerEvents: "none",
            fontSize: "20px",
            zIndex: 999
          }}
        >
          🐖
        </div>
      )}

      {ruta && (
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none"
          }}
        >

          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="lime" />
            </marker>
          </defs>

          <path
            d={`
              M ${ruta.from.x} ${ruta.from.y}
              Q ${(ruta.from.x + ruta.to.x) / 2} ${(ruta.from.y + ruta.to.y) / 2 - 80}
                ${ruta.to.x} ${ruta.to.y}
            `}
            stroke="lime"
            strokeWidth="4"
            fill="transparent"
            markerEnd="url(#arrow)"
            style={{
              animation: "dash 0.6s linear"
            }}
          />
        </svg>
      )}
    </div>
  );
}
