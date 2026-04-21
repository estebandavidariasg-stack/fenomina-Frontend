import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { Coins, ChevronLeft, UserRound } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const MOCK_PROCESO = {
  nombreEmpresa:   'EMPRESA SAS COLOMBIA SAS',
  nit:             'XXXXXXXX',
  fechaGeneracion: '17-06-2026',
  periodo:         '2025',
  estado:          'Cerrado',
  logoUrl:         null, // reemplazar con URL del backend
};

const MOCK_EMPLEADOS = [
  { id: 1, cc: '1.007.013.452', nombre: 'PATRIA ANDRADE YANET CLARISA', fechaIngreso: '1/01/2025', fechaCorteInicio: '1/01/2025', fechaCortesFin: '30/12/2025', dias: 360, salarioBase: 1423500, auxilioTransporte: 200000, salarioLiquidacion: 1623500, cesantias: 1623500, interesesCesantias: 194820, fondoPensiones: 'PORVENIR' },
  { id: 2, cc: '1.022.436.185', nombre: 'MURILLO ZAMORA CESAR STEVEN',  fechaIngreso: '1/01/2025', fechaCorteInicio: '1/01/2025', fechaCortesFin: '30/12/2025', dias: 360, salarioBase: 1423500, auxilioTransporte: 200000, salarioLiquidacion: 1623500, cesantias: 1623500, interesesCesantias: 194820, fondoPensiones: 'PROTECCION' },
  { id: 3, cc: '1.030.615.649', nombre: 'OLMOS CUBIDES HERNAN YESID',   fechaIngreso: '1/01/2025', fechaCorteInicio: '1/01/2025', fechaCortesFin: '30/12/2025', dias: 360, salarioBase: 1423500, auxilioTransporte: 200000, salarioLiquidacion: 1623500, cesantias: 1623500, interesesCesantias: 194820, fondoPensiones: 'FNA' },
  { id: 4, cc: '1.072.668.844', nombre: 'ORTIZ CASTRO FABIO ALEJANDRO', fechaIngreso: '1/01/2025', fechaCorteInicio: '1/01/2025', fechaCortesFin: '30/12/2025', dias: 360, salarioBase: 1423500, auxilioTransporte: 200000, salarioLiquidacion: 1623500, cesantias: 1623500, interesesCesantias: 194820, fondoPensiones: 'COLFONDOS' },
  { id: 5, cc: '1.072.701.886', nombre: 'ORTIZ CASTRO CAROLINA',        fechaIngreso: '1/01/2025', fechaCorteInicio: '1/01/2025', fechaCortesFin: '30/12/2025', dias: 360, salarioBase: 1423500, auxilioTransporte: 200000, salarioLiquidacion: 1623500, cesantias: 1623500, interesesCesantias: 194820, fondoPensiones: 'SKANDIA' },
];

const fmt = (v) => v != null ? '$' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

export default function ResultadoCesantiasPage() {
  const navigate             = useNavigate();
  const { id, cesantiaId }   = useParams();
  const { usuario }          = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  const [hoverDescargar, setHoverDescargar] = useState(false);
  const [descargando, setDescargando]       = useState(false);

  const totalCesantias = MOCK_EMPLEADOS.reduce((s, e) => s + e.cesantias, 0);
  const totalIntereses = MOCK_EMPLEADOS.reduce((s, e) => s + e.interesesCesantias, 0);

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => {
      const doc = new jsPDF('landscape');

      // ── Página 1: Planilla general ──────────────────────────
      let y = 14;
      if (MOCK_PROCESO.logoUrl) {
        doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, y, 20, 20);
      }

      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('NOMBRE DE LA EMPRESA', 148, y + 4, { align: 'center' });
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      doc.text(`NIT: ${MOCK_PROCESO.nit}`, 148, y + 10, { align: 'center' });
      doc.text(`CESANTIAS E INTERESES DE LAS CESANTIAS ${MOCK_PROCESO.periodo}`, 148, y + 16, { align: 'center' });
      y += 26;

      autoTable(doc, {
        startY: y,
        head: [['No', 'CC', 'NOMBRES Y APELLIDOS', 'DÍAS', 'FECHA INGRESO', 'FECHA CORTE INICIO', 'FECHA CORTE FIN', 'SALARIO BASE', 'AUX TRANSPORTE', 'SAL. LIQUIDACIÓN', 'CESANTÍAS', 'INTERESES CESANTÍAS', 'FONDO PENSIONES']],
        body: [
          ...MOCK_EMPLEADOS.map((emp, i) => [
            i + 1, emp.cc, emp.nombre, emp.dias, emp.fechaIngreso,
            emp.fechaCorteInicio, emp.fechaCortesFin,
            fmt(emp.salarioBase), fmt(emp.auxilioTransporte),
            fmt(emp.salarioLiquidacion), fmt(emp.cesantias),
            fmt(emp.interesesCesantias), emp.fondoPensiones,
          ]),
          [{ content: 'TOTAL', colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } },
           { content: fmt(totalCesantias), styles: { fontStyle: 'bold' } },
           { content: fmt(totalIntereses), styles: { fontStyle: 'bold' } }, ''],
        ],
        styles: { fontSize: 6 },
        headStyles: { fillColor: [11, 102, 42], textColor: 255, fontStyle: 'bold', fontSize: 6 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // ── Páginas siguientes: Comprobante por empleado ────────
      MOCK_EMPLEADOS.forEach((emp) => {
        doc.addPage('portrait');
        let cy = 20;
        doc.setDrawColor(0); doc.rect(10, 10, 190, 165);

        // Logo en PDF si existe
        if (MOCK_PROCESO.logoUrl) {
          doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, cy, 20, 20);
        }

        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text('Empleador:', 14, cy); doc.text(MOCK_PROCESO.nombreEmpresa, 60, cy);
        doc.setFont(undefined, 'normal');
        doc.text('NIT:', 14, cy + 6); doc.text(MOCK_PROCESO.nit, 60, cy + 6); cy += 16;

        doc.setFont(undefined, 'bold'); doc.text('Datos del trabajador:', 14, cy); cy += 6;
        doc.setFont(undefined, 'normal');
        doc.text('Nombre:', 14, cy); doc.text(emp.nombre, 60, cy); cy += 6;
        doc.text('Cédula:', 14, cy); doc.text(emp.cc, 60, cy); cy += 10;

        doc.setFont(undefined, 'bold');
        doc.text(`Liquidaciones de cesantías e intereses de cesantias ${MOCK_PROCESO.periodo}`, 105, cy, { align: 'center' });
        cy += 10;

        doc.setFont(undefined, 'normal');
        doc.text('Fecha inicial:', 14, cy); doc.text(emp.fechaCorteInicio, 80, cy); cy += 6;
        doc.text('Fecha final:', 14, cy); doc.text(emp.fechaCortesFin, 80, cy); cy += 6;
        doc.text('Días trabajados:', 14, cy); doc.text(String(emp.dias), 80, cy); cy += 10;

        doc.text('Salario Base:', 14, cy); doc.text('$', 70, cy); doc.text(emp.salarioBase.toLocaleString('es-CO'), 80, cy); cy += 6;
        doc.text('Auxilio de transporte:', 14, cy); doc.text('$', 70, cy); doc.text(emp.auxilioTransporte.toLocaleString('es-CO'), 80, cy); cy += 6;
        doc.text('Cesantías (informativo):', 14, cy); doc.text('$', 70, cy); doc.text('-', 80, cy); cy += 6;
        doc.text('Intereses de cesantías:', 14, cy); doc.text('$', 70, cy); doc.text('-', 80, cy); cy += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Valor a pagar intereses de cesantías:', 14, cy); doc.text('$', 70, cy); doc.text('-', 80, cy); cy += 6;
        doc.text('Valor en letras:'); doc.setFont(undefined, 'normal');
        doc.text('PESOS M/CTE', 55, cy); cy += 12;

        doc.text('Recibí conforme:', 14, cy); cy += 14;
        doc.line(14, cy, 80, cy); cy += 5;
        doc.setFont(undefined, 'bold'); doc.text(emp.nombre, 14, cy);
        doc.setFont(undefined, 'normal'); cy += 5;
        doc.text('Fecha de recibido:', 14, cy);
      });

      doc.save(`cesantias_${MOCK_PROCESO.periodo}.pdf`);
      setDescargando(false);
    }, 100);
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={18} color="#0B662A" />
          <div>
            <h2 style={styles.titulo}>Desprendibles Cesantías e Intereses</h2>
            <p style={styles.subtitulo}>Ver desprendibles de cesantías e intereses</p>
          </div>
        </div>
        <div style={styles.perfilBox}>
          <div style={styles.avatar}><UserRound size={22} color="#A3A3A3" /></div>
          <div><p style={styles.perfilNombre}>{nombre}</p><p style={styles.perfilCargo}>{cargo}</p></div>
        </div>
      </div>

      {/* Volver sticky */}
      <div style={styles.stickyBar}>
        <button style={styles.volverBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} color="#272525" /><span>Volver</span>
        </button>
        <button
          style={{ ...styles.btnDescargarSticky, background: hoverDescargar ? 'linear-gradient(135deg, #0B662A, #1a9e45)' : '#0B662A', transition: 'background 0.3s ease' }}
          onMouseEnter={() => setHoverDescargar(true)}
          onMouseLeave={() => setHoverDescargar(false)}
          onClick={handleDescargar}
        >
          Descargar Reportes en PDF
        </button>
      </div>

      {/* Info proceso */}
      <div style={styles.card}>
        <h3 style={styles.cardTitulo}>Desprendibles Cesantías e Intereses de Cesantías</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nombre Empresa:</span><span style={styles.infoValor}>{MOCK_PROCESO.nombreEmpresa}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nit:</span><span style={styles.infoValor}>{MOCK_PROCESO.nit}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Fecha de Generación de Reporte:</span><span style={styles.infoValor}>{MOCK_PROCESO.fechaGeneracion}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Periodo:</span><span style={styles.infoValor}>{MOCK_PROCESO.periodo}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Estado:</span><span style={styles.infoValor}>{MOCK_PROCESO.estado}</span></div>
        </div>
        <hr style={styles.divider} />
      </div>

      {/* Planilla resumen */}
      <div style={styles.card}>
        <p style={styles.tableTitle}>Cesantías e Intereses — {MOCK_PROCESO.periodo}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>No</th>
                <th style={styles.th}>CC</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Nombres y Apellidos</th>
                <th style={styles.th}>Días</th>
                <th style={styles.th}>Fecha Ingreso</th>
                <th style={styles.th}>Fecha Corte Inicio</th>
                <th style={styles.th}>Fecha Corte Fin</th>
                <th style={styles.th}>Salario Base</th>
                <th style={styles.th}>Aux. Transporte</th>
                <th style={styles.th}>Sal. Liquidación</th>
                <th style={styles.th}>Cesantías</th>
                <th style={styles.th}>Intereses Cesantías</th>
                <th style={styles.th}>Fondo Pensiones</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EMPLEADOS.map((emp, i) => (
                <tr key={emp.id} style={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{emp.cc}</td>
                  <td style={{ ...styles.td, textAlign: 'left' }}>{emp.nombre}</td>
                  <td style={styles.td}>{emp.dias}</td>
                  <td style={styles.td}>{emp.fechaIngreso}</td>
                  <td style={styles.td}>{emp.fechaCorteInicio}</td>
                  <td style={styles.td}>{emp.fechaCortesFin}</td>
                  <td style={styles.td}>{fmt(emp.salarioBase)}</td>
                  <td style={styles.td}>{fmt(emp.auxilioTransporte)}</td>
                  <td style={styles.td}>{fmt(emp.salarioLiquidacion)}</td>
                  <td style={styles.td}>{fmt(emp.cesantias)}</td>
                  <td style={styles.td}>{fmt(emp.interesesCesantias)}</td>
                  <td style={styles.td}>{emp.fondoPensiones}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#E8F5EE' }}>
                <td colSpan={10} style={{ ...styles.td, fontWeight: '800', textAlign: 'right', color: '#0B662A' }}>TOTAL</td>
                <td style={{ ...styles.td, fontWeight: '800', color: '#0B662A' }}>{fmt(totalCesantias)}</td>
                <td style={{ ...styles.td, fontWeight: '800', color: '#0B662A' }}>{fmt(totalIntereses)}</td>
                <td style={styles.td} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprobantes individuales con logo */}
      {MOCK_EMPLEADOS.map((emp) => (
        <div key={emp.id} style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={styles.comprobante}>

            {/* Logo en previsualización */}
            {MOCK_PROCESO.logoUrl && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <img src={MOCK_PROCESO.logoUrl} alt="logo" style={{ width: '60px', objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '2px' }}>
                <span style={{ ...styles.comprobanteLabel, fontWeight: '700', minWidth: '80px' }}>Empleador:</span>
                <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>{MOCK_PROCESO.nombreEmpresa}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ ...styles.comprobanteLabel, minWidth: '80px' }}>NIT:</span>
                <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>{MOCK_PROCESO.nit}</span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ ...styles.comprobanteLabel, fontWeight: '700', margin: '0 0 4px 0' }}>Datos del trabajador:</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '2px' }}>
                <span style={{ ...styles.comprobanteLabel, minWidth: '80px' }}>Nombre:</span>
                <span style={styles.comprobanteValor}>{emp.nombre}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ ...styles.comprobanteLabel, minWidth: '80px' }}>Cédula:</span>
                <span style={styles.comprobanteValor}>{emp.cc}</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', fontWeight: '700', textAlign: 'center', margin: '12px 0', color: '#272525' }}>
              Liquidaciones de cesantías e intereses de cesantías {MOCK_PROCESO.periodo}
            </p>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '2px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '160px' }}>Fecha inicial:</span><span style={styles.comprobanteValor}>{emp.fechaCorteInicio}</span></div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '2px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '160px' }}>Fecha final:</span><span style={styles.comprobanteValor}>{emp.fechaCortesFin}</span></div>
              <div style={{ display: 'flex', gap: '12px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '160px' }}>Días trabajados:</span><span style={styles.comprobanteValor}>{emp.dias}</span></div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '200px' }}>Salario Base:</span><span style={styles.comprobanteValor}>$</span><span style={styles.comprobanteValor}>{emp.salarioBase.toLocaleString('es-CO')}</span></div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '200px' }}>Auxilio de transporte:</span><span style={styles.comprobanteValor}>$</span><span style={styles.comprobanteValor}>{emp.auxilioTransporte.toLocaleString('es-CO')}</span></div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '200px' }}>Cesantías (informativo):</span><span style={styles.comprobanteValor}>$</span><span style={styles.comprobanteValor}>-</span></div>
              <div style={{ display: 'flex', gap: '8px' }}><span style={{ ...styles.comprobanteLabel, minWidth: '200px' }}>Intereses de cesantías:</span><span style={styles.comprobanteValor}>$</span><span style={styles.comprobanteValor}>-</span></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                <span style={{ ...styles.comprobanteLabel, fontWeight: '700', minWidth: '200px' }}>Valor a pagar intereses de cesantías:</span>
                <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>$</span>
                <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>-</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ ...styles.comprobanteLabel, fontWeight: '700' }}>Valor en letras:</span>
                <span style={styles.comprobanteValor}>PESOS M/CTE</span>
              </div>
            </div>

            <p style={{ ...styles.comprobanteLabel, marginBottom: '20px' }}>Recibí conforme:</p>
            <div style={{ borderTop: '1px solid #272525', width: '220px', paddingTop: '6px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#272525', margin: '0 0 2px 0' }}>{emp.nombre}</p>
              <p style={{ fontSize: '11px', color: '#272525', margin: 0 }}>Fecha de recibido:</p>
            </div>
          </div>
        </div>
      ))}

      {/* Modal descarga */}
      {descargando && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={28} color="#0B662A" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '800', color: '#272525', margin: 0 }}>Descarga en curso</p>
            <p style={{ fontSize: '13px', color: '#A3A3A3', margin: 0 }}>La descarga de los desprendibles tomará unos segundos.</p>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container:          { padding: '0', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', gap: '16px' },
  header:             { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo:             { fontSize: '18px', fontWeight: '800', color: '#272525', margin: 0 },
  subtitulo:          { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  perfilBox:          { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:             { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#D0D0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  perfilNombre:       { fontSize: '13px', fontWeight: '700', color: '#272525', margin: 0, lineHeight: 1.3 },
  perfilCargo:        { fontSize: '11px', color: '#A3A3A3', fontWeight: '400', margin: 0 },
stickyBar: { position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'transparent', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },  volverBtn:          { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#272525', fontFamily: 'Nunito, sans-serif', padding: 0 },
  btnDescargarSticky: { color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  card:               { backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px' },
  cardTitulo:         { fontSize: '16px', fontWeight: '800', color: '#272525', margin: '0 0 12px 0' },
  infoGrid:           { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoFila:           { display: 'flex', gap: '8px', alignItems: 'baseline' },
  infoLabel:          { fontSize: '13px', fontWeight: '700', color: '#272525', whiteSpace: 'nowrap' },
  infoValor:          { fontSize: '13px', color: '#272525' },
  divider:            { border: 'none', borderTop: '1px solid #E8E8E8', margin: '24px 0 0 0' },
  tableTitle:         { fontSize: '15px', fontWeight: '800', color: '#272525', margin: '0 0 16px 0' },
  tabla:              { width: '100%', borderCollapse: 'collapse', minWidth: '1000px', fontSize: '11px' },
  th:                 { backgroundColor: '#F0F0F0', fontWeight: '700', color: '#272525', padding: '7px 8px', textAlign: 'center', border: '1px solid #E0E0E0', whiteSpace: 'nowrap', fontSize: '11px' },
  td:                 { padding: '6px 8px', textAlign: 'center', color: '#272525', border: '1px solid #E0E0E0', whiteSpace: 'nowrap', fontSize: '11px' },
  trPar:              { backgroundColor: '#fff' },
  trImpar:            { backgroundColor: '#FAFAFA' },
  comprobante:        { border: '1px solid #D0D0D0', borderRadius: '4px', padding: '24px 28px', width: '100%', maxWidth: '680px', boxSizing: 'border-box', backgroundColor: '#fff', marginBottom: '8px' },
  comprobanteLabel:   { fontSize: '11px', color: '#272525', margin: 0 },
  comprobanteValor:   { fontSize: '11px', color: '#272525', margin: 0 },
};
