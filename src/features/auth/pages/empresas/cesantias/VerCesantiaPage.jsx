import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { Coins, UserRound } from 'lucide-react';


const MOCK_CESANTIA = {
  diasLaborados: 360,
  otrosPagos: [
    { nombre: 'RECARGO NOCTURNO DE LUNES A SÁBADO', fecha: '03/04/2024', monto: '40.000' },
    { nombre: 'RECARGO NOCTURNO UN DOMINGO O FESTIVO', fecha: '22/05/2024', monto: '35.000' },
  ],
  fondoCesantias: 'Porvenir',
};

export default function VerCesantiaPage() {
  const navigate   = useNavigate();
  const { usuario } = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={18} color="#0B662A" />
          <div>
            <h2 style={styles.titulo}>Ver Intereses de Cesantías</h2>
            <p style={styles.subtitulo}>Revisa los valores para la liquidación de intereses de cesantías del empleado</p>
          </div>
        </div>
        <div style={styles.perfilBox}>
          <div style={styles.avatar}><UserRound size={22} color="#A3A3A3" /></div>
          <div><p style={styles.perfilNombre}>{nombre}</p><p style={styles.perfilCargo}>{cargo}</p></div>
        </div>
      </div>

      {/* Card 1 — Base de Liquidación */}
      <div style={styles.card}>
        <h3 style={styles.cardTitulo}>Intereses de Cesantías</h3>
        <p style={styles.seccionTitulo}>Base de Liquidación</p>
        <p style={styles.descripcion}>
          Total de días calendario laborados dentro del periodo de corte. Este valor es la base temporal para aplicar la fórmula legal de las cesantías.
        </p>
        <div style={{ maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={styles.label}>Días laborados <span style={{ color: '#E53E3E' }}>*</span></label>
          <input value={MOCK_CESANTIA.diasLaborados} readOnly style={{ ...styles.input, backgroundColor: '#F9F9F9', color: '#A3A3A3' }} />
        </div>
      </div>

      {/* Card 2 — Otros Pagos */}
      <div style={styles.card}>
        <p style={styles.seccionTitulo}>Otros Pagos para Liquidación de Cesantías e Intereses de Cesantías</p>
        <p style={styles.descripcion}>
          Valores adicionales que, por ley o acuerdo, deben sumarse a la base de las cesantías (como comisiones, recargos o bonificaciones salariales) que no estén reflejados en el sueldo fijo.
        </p>

        {MOCK_CESANTIA.otrosPagos.map((p, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <div style={styles.gridFila}>
              <span style={styles.label}>Nombre de novedad</span>
              <span style={styles.label}>Fecha de novedad</span>
              <span style={styles.label}>Monto (valor del pago o compensación)</span>
            </div>
            <div style={styles.gridFila}>
              <input readOnly value={p.nombre} style={{ ...styles.input, textTransform: 'uppercase', fontSize: '12px', backgroundColor: '#F9F9F9' }} />
              <input readOnly value={p.fecha}  style={{ ...styles.input, backgroundColor: '#F9F9F9' }} />
              <input readOnly value={p.monto}  style={{ ...styles.input, textAlign: 'right', backgroundColor: '#F9F9F9' }} />
            </div>
          </div>
        ))}

        <hr style={styles.divider} />
        <p style={styles.nota}>
          Recuerde que estos valores adicionales corresponden a conceptos variables que se han liquidado durante el semestre en cada nómina mensual o quincenal del empleado y serán promediados para el cálculo de cesantías e intereses.
        </p>
      </div>

      {/* Card 3 — Fondo de Cesantías */}
      <div style={styles.card}>
        <p style={styles.seccionTitulo}>Fondo de Cesantías</p>
        <p style={styles.descripcion}>
          Nombre del fondo de cesantías al que se le tendrá que consignar el valor neto de cesantías al empleado asociado.
        </p>
        <div style={{ maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={styles.label}>Fondo de cesantías <span style={{ color: '#E53E3E' }}>*</span></label>
          <input value={MOCK_CESANTIA.fondoCesantias} readOnly style={{ ...styles.input, backgroundColor: '#F9F9F9', color: '#A3A3A3' }} placeholder="Porvenir" />
        </div>
      </div>

      {/* Botón */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
        <button style={styles.btnRegresar} onClick={() => navigate(-1)}>Regresar</button>
      </div>

    </div>
  );
}

const styles = {
  container:    { padding: '0', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', gap: '16px' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo:       { fontSize: '18px', fontWeight: '800', color: '#272525', margin: 0 },
  subtitulo:    { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  perfilBox:    { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:       { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#D0D0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  perfilNombre: { fontSize: '13px', fontWeight: '700', color: '#272525', margin: 0, lineHeight: 1.3 },
  perfilCargo:  { fontSize: '11px', color: '#A3A3A3', fontWeight: '400', margin: 0 },
  card:         { backgroundColor: '#fff', borderRadius: '16px', padding: '36px 40px' },
  cardTitulo:   { fontSize: '20px', fontWeight: '800', color: '#272525', margin: '0 0 28px 0' },
  seccionTitulo:{ fontSize: '15px', fontWeight: '800', color: '#272525', margin: '0 0 10px 0' },
  descripcion:  { fontSize: '13px', color: '#555', margin: '0 0 20px 0', lineHeight: 1.7 },
  label:        { fontSize: '13px', fontWeight: '600', color: '#272525' },
  input:        { border: '1px solid #D0D0D0', borderRadius: '8px', padding: '11px 16px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#272525', boxSizing: 'border-box', width: '100%' },
  gridFila:     { display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '12px', marginBottom: '8px', alignItems: 'center' },
  divider:      { border: 'none', borderTop: '1px solid #E8E8E8', margin: '20px 0' },
  nota:         { fontSize: '13px', color: '#555', lineHeight: 1.7, margin: 0 },
  btnRegresar:  { backgroundColor: '#0B662A', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px 60px', fontSize: '14px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
};
