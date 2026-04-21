import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

const TRANSICIONES = {
  'ACTIVO':   ['Inactivo'],
  'INACTIVO': ['Activo'],
  'RETIRADO': ['Activo'],
};

const ESTADOS = [
  { value: 'Inactivo', color: '#E65100' },
  { value: 'Activo',   color: '#0B662A' },
  { value: 'Retirado', color: '#C62828' },
];

const styles = {
  dropdown: {position: 'fixed', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: '160px', padding: '8px 0', overflow: 'hidden'},
  opcion:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', cursor: 'pointer' },
};

export default function EstadoDropdown({ estadoActual, onCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!abierto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosicion({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setAbierto(!abierto);
  };

  const colorActual = ESTADOS.find(e => e.value === estadoActual)?.color ?? '#0B662A';
  const opcionesPermitidas = ESTADOS.filter(e =>
    TRANSICIONES[estadoActual]?.includes(e.value)
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: colorActual + '18',
          color: colorActual,
          border: `1px solid ${colorActual}40`,
          borderRadius: '20px', padding: '4px 12px',
          fontSize: '12px', fontWeight: '600',
          fontFamily: 'Nunito, sans-serif', cursor: 'pointer',
        }}
      >
        {estadoActual}
        <span style={{ fontSize: '10px' }}>▾</span>
      </button>

      {abierto && (
        <div style={{
          position: 'fixed',
          top: posicion.top,
          left: posicion.left,
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '160px',
          padding: '8px 0',
          overflow: 'hidden',
        }}>
          {/* 
          {/* Estado actual — solo lectura */}
          <div style={{ ...styles.opcion, opacity: 0.5, cursor: 'default' }}>
            <span style={{ color: colorActual, fontWeight: '600', fontSize: '14px' }}>
              {estadoActual.charAt(0).toUpperCase() + estadoActual.slice(1).toLowerCase()}
            </span>
            <Check size={16} color="#272525" />
          </div>
          

          {/* Opciones permitidas */}
          {opcionesPermitidas.map((e) => (
            <div
              key={e.value}
              style={styles.opcion}
              onClick={() => {
                onCambiar(e.value);
                setAbierto(false);
              }}
            >
              <span style={{ color: e.color, fontWeight: '600', fontSize: '14px' }}>
                {e.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}