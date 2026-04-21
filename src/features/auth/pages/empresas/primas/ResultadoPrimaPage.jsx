import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { CreditCard, ChevronLeft, UserRound } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const MOCK_PROCESO = {
  nombreEmpresa:   'EMPRESA SAS COLOMBIA SAS',
  nit:             '900.130.685-6',
  fechaGeneracion: '03-12-2026',
  periodo:         'Diciembre de 2026',
  semestre:        'Segundo semestre 2025',
  estado:          'Pendiente por pagar',
  logoUrl:         null,
};

const MOCK_EMPLEADOS = [
  { id: 1, cc: '1.007.013.452', nombre: 'PATRIA ANDRADE YANET CLARISA', fechaInicio: '1/07/2025', fechaFin: '30/12/2025', dias: 180, salarioBase: 1423500, auxilioTransporte: 200000, otrosPagos: 0 },
  { id: 2, cc: '1.022.436.185', nombre: 'MURILLO ZAMORA CESAR STEVEN',  fechaInicio: '1/07/2025', fechaFin: '30/12/2025', dias: 180, salarioBase: 1423500, auxilioTransporte: 200000, otrosPagos: 0 },
  { id: 3, cc: '1.030.615.649', nombre: 'OLMOS CUBIDES HERNAN YESID',   fechaInicio: '4/07/2025', fechaFin: '30/12/2025', dias: 177, salarioBase: 1423500, auxilioTransporte: 200000, otrosPagos: 0 },
  { id: 4, cc: '1.072.668.844', nombre: 'ORTIZ CASTRO FABIO ALEJANDRO', fechaInicio: '1/07/2025', fechaFin: '30/12/2025', dias: 180, salarioBase: 1423500, auxilioTransporte: 200000, otrosPagos: 0 },
  { id: 5, cc: '1.072.701.886', nombre: 'ORTIZ CASTRO CAROLINA',        fechaInicio: '1/07/2025', fechaFin: '30/12/2025', dias: 180, salarioBase: 1423500, auxilioTransporte: 200000, otrosPagos: 0 },
];

const calcularNeto = (emp) => Math.round((emp.salarioBase + emp.auxilioTransporte + emp.otrosPagos) * emp.dias / 360);
const fmt = (v) => '$' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const unidades = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
const decenas  = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

function numLetras(n) {
  if (n === 0) return 'CERO';
  if (n < 0) return 'MENOS ' + numLetras(-n);
  let r = '';
  if (n >= 1000000) { r += numLetras(Math.floor(n/1000000)) + ' MILLÓN '; n %= 1000000; }
  if (n >= 1000)    { r += (Math.floor(n/1000) === 1 ? 'MIL' : numLetras(Math.floor(n/1000)) + ' MIL') + ' '; n %= 1000; }
  if (n >= 100)     { r += (n === 100 ? 'CIEN' : centenas[Math.floor(n/100)]) + ' '; n %= 100; }
  if (n >= 20)      { r += decenas[Math.floor(n/10)] + (n%10 ? ' Y ' + unidades[n%10] : '') + ' '; }
  else if (n > 0)   { r += unidades[n] + ' '; }
  return r.trim();
}

export default function ResultadoPrimaPage() {
  const navigate        = useNavigate();
  const { id, primaId } = useParams();
  const { usuario }     = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  const [hoverDescargar, setHoverDescargar] = useState(false);
  const [descargando, setDescargando]       = useState(false);

  const totalGeneral = MOCK_EMPLEADOS.reduce((s, e) => s + calcularNeto(e), 0);

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => {
      const doc = new jsPDF();
      let y = 14;

      if (MOCK_PROCESO.logoUrl) doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, y, 25, 25);

      doc.setFontSize(12); doc.setFont(undefined, 'bold');
      doc.text(MOCK_PROCESO.nombreEmpresa, 105, y + 6, { align: 'center' });
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      doc.text(`NIT: ${MOCK_PROCESO.nit}`, 105, y + 12, { align: 'center' });
      doc.text('INGRESO / PAGOS', 105, y + 18, { align: 'center' });
      doc.text(`PLANILLA PRIMA II SEMESTRE 2025`, 105, y + 24, { align: 'center' });
      y += 34;

      autoTable(doc, {
        startY: y,
        head: [['No', 'CC', 'NOMBRES Y APELLIDOS', 'FECHA INICIO', 'FECHA FIN', 'DÍAS', 'SALARIO BASE', 'AUX. TRANSPORTE', 'NETO']],
        body: [
          ...MOCK_EMPLEADOS.map((emp, i) => [i+1, emp.cc, emp.nombre, emp.fechaInicio, emp.fechaFin, emp.dias, fmt(emp.salarioBase), fmt(emp.auxilioTransporte), fmt(calcularNeto(emp))]),
          [{ content: 'TOTAL', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } }, { content: fmt(totalGeneral), styles: { fontStyle: 'bold' } }],
        ],
        styles: { fontSize: 7 },
        headStyles: { fillColor: [11, 102, 42], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      MOCK_EMPLEADOS.forEach((emp) => {
        doc.addPage();
        const neto = calcularNeto(emp);
        let cy = 20;
        doc.setDrawColor(0); doc.rect(10, 10, 190, cy + 130);

        if (MOCK_PROCESO.logoUrl) doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, cy, 20, 20);

        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text('Empleador:', 14, cy + 6); doc.text(MOCK_PROCESO.nombreEmpresa, 60, cy + 6);
        doc.setFont(undefined, 'normal');
        doc.text('NIT:', 14, cy + 12); doc.text(`NIT: ${MOCK_PROCESO.nit}`, 60, cy + 12); cy += 20;

        doc.setFont(undefined, 'bold'); doc.text('Datos del trabajador:', 14, cy); cy += 6;
        doc.setFont(undefined, 'normal');
        doc.text('Nombre:', 14, cy); doc.text(emp.nombre, 60, cy); cy += 6;
        doc.text('Cédula:', 14, cy); doc.text(emp.cc, 60, cy); cy += 10;

        doc.setFontSize(9); doc.setFont(undefined, 'bold');
        doc.text(`Comprobante del pago de la prima de servicios correspondiente al ${MOCK_PROCESO.semestre}`, 105, cy, { align: 'center' });
        cy += 10;

        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text('Fecha inicial:', 14, cy); doc.text(emp.fechaInicio, 80, cy); cy += 6;
        doc.text('Fecha final:', 14, cy); doc.text(emp.fechaFin, 80, cy); cy += 6;
        doc.text('Días trabajados en el semestre:', 14, cy); doc.text(String(emp.dias), 80, cy); cy += 10;

        doc.text('Salario Base:', 14, cy); doc.text('$', 70, cy); doc.text(String(Math.round(emp.salarioBase).toLocaleString('es-CO')), 80, cy); cy += 6;
        doc.text('Auxilio de transporte:', 14, cy); doc.text('$', 70, cy); doc.text(String(Math.round(emp.auxilioTransporte).toLocaleString('es-CO')), 80, cy); cy += 6;
        doc.text('Otros pagos:', 14, cy); cy += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Valor de la prima de servicios:', 14, cy); doc.text('$', 70, cy); doc.text(String(Math.round(neto).toLocaleString('es-CO')), 80, cy); cy += 6;
        doc.text('Valor en letras:', 14, cy);
        doc.setFont(undefined, 'normal');
        const letras = numLetras(neto) + ' PESOS M/CTE';
        const split = doc.splitTextToSize(letras, 120);
        doc.text(split, 55, cy); cy += split.length * 5 + 6;

        doc.text('Recibí conforme:', 14, cy); cy += 14;
        doc.line(14, cy, 80, cy); cy += 5;
        doc.text(emp.nombre, 14, cy); cy += 5;
        doc.text('Fecha de recibido:', 14, cy);
      });

      doc.save(`prima_${MOCK_PROCESO.semestre.replace(/ /g,'_')}.pdf`);
      setDescargando(false);
    }, 100);
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} color="#0B662A" />
          <div>
            <h2 style={styles.titulo}>Desprendibles Prima</h2>
            <p style={styles.subtitulo}>Ver desprendibles de Prima</p>
          </div>
        </div>
        <div style={styles.perfilBox}>
          <div style={styles.avatar}><UserRound size={22} color="#A3A3A3" /></div>
          <div><p style={styles.perfilNombre}>{nombre}</p><p style={styles.perfilCargo}>{cargo}</p></div>
        </div>
      </div>

      {/* Barra sticky */}
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
        <h3 style={styles.cardTitulo}>Desprendibles Prima</h3>
        <p style={styles.exitoMsg}>¡Prima liquidada exitosamente!</p>
        <div style={styles.infoGrid}>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nombre Empresa:</span><span style={styles.infoValor}>{MOCK_PROCESO.nombreEmpresa}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nit:</span><span style={styles.infoValor}>{MOCK_PROCESO.nit}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Fecha de Generación de Reporte:</span><span style={styles.infoValor}>{MOCK_PROCESO.fechaGeneracion}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Periodo:</span><span style={styles.infoValor}>{MOCK_PROCESO.periodo}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Semestre:</span><span style={styles.infoValor}>{MOCK_PROCESO.semestre}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Estado:</span><span style={styles.infoValor}>{MOCK_PROCESO.estado}</span></div>
        </div>
        <hr style={styles.divider} />
      </div>

      {/* Planilla resumen */}
      <div style={styles.card}>
        <p style={styles.tableTitle}>Planilla Prima — {MOCK_PROCESO.semestre}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>No</th>
                <th style={styles.th}>CC</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Nombres y Apellidos</th>
                <th style={styles.th}>Fecha inicio</th>
                <th style={styles.th}>Fecha fin</th>
                <th style={styles.th}>Días</th>
                <th style={styles.th}>Salario Base</th>
                <th style={styles.th}>Aux. Transporte</th>
                <th style={styles.th}>Neto</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EMPLEADOS.map((emp, i) => (
                <tr key={emp.id} style={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{emp.cc}</td>
                  <td style={{ ...styles.td, textAlign: 'left' }}>{emp.nombre}</td>
                  <td style={styles.td}>{emp.fechaInicio}</td>
                  <td style={styles.td}>{emp.fechaFin}</td>
                  <td style={styles.td}>{emp.dias}</td>
                  <td style={styles.td}>{fmt(emp.salarioBase)}</td>
                  <td style={styles.td}>{fmt(emp.auxilioTransporte)}</td>
                  <td style={styles.td}>{fmt(calcularNeto(emp))}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#E8F5EE' }}>
                <td colSpan={8} style={{ ...styles.td, fontWeight: '800', textAlign: 'right', color: '#0B662A' }}>TOTAL</td>
                <td style={{ ...styles.td, fontWeight: '800', color: '#0B662A' }}>{fmt(totalGeneral)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprobantes individuales */}
      {MOCK_EMPLEADOS.map((emp) => {
        const neto = calcularNeto(emp);
        return (
          <div key={emp.id} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={styles.comprobante}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}>
                  <span style={styles.comprobanteLabel}>Empleador:</span>
                  <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>{MOCK_PROCESO.nombreEmpresa}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={styles.comprobanteLabel}>NIT:</span>
                  <span style={styles.comprobanteValor}>NIT: {MOCK_PROCESO.nit}</span>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <p style={{ ...styles.comprobanteLabel, fontWeight: '700', margin: '0 0 4px 0' }}>Datos del trabajador:</p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}>
                  <span style={styles.comprobanteLabel}>Nombre:</span>
                  <span style={styles.comprobanteValor}>{emp.nombre}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={styles.comprobanteLabel}>Cédula:</span>
                  <span style={styles.comprobanteValor}>{emp.cc}</span>
                </div>
              </div>

              <p style={{ fontSize: '11px', fontWeight: '700', textAlign: 'center', margin: '12px 0', color: '#272525' }}>
                Comprobante del pago de la prima de servicios correspondiente al {MOCK_PROCESO.semestre}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}><span style={styles.comprobanteLabel}>Fecha inicial:</span><span style={styles.comprobanteValor}>{emp.fechaInicio}</span></div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}><span style={styles.comprobanteLabel}>Fecha final:</span><span style={styles.comprobanteValor}>{emp.fechaFin}</span></div>
                <div style={{ display: 'flex', gap: '16px' }}><span style={styles.comprobanteLabel}>Días trabajados en el semestre:</span><span style={styles.comprobanteValor}>{emp.dias}</span></div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}>
                  <span style={{ ...styles.comprobanteLabel, width: '160px' }}>Salario Base:</span>
                  <span style={styles.comprobanteValor}>$</span>
                  <span style={styles.comprobanteValor}>{fmt(emp.salarioBase)}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}>
                  <span style={{ ...styles.comprobanteLabel, width: '160px' }}>Auxilio de transporte:</span>
                  <span style={styles.comprobanteValor}>$</span>
                  <span style={styles.comprobanteValor}>{fmt(emp.auxilioTransporte)}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ ...styles.comprobanteLabel, width: '160px' }}>Otros pagos:</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '2px' }}>
                  <span style={{ ...styles.comprobanteLabel, fontWeight: '700', width: '160px' }}>Valor de la prima de servicios:</span>
                  <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>$</span>
                  <span style={{ ...styles.comprobanteValor, fontWeight: '700' }}>{fmt(neto)}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ ...styles.comprobanteLabel, fontWeight: '700' }}>Valor en letras:</span>
                  <span style={{ ...styles.comprobanteValor, textTransform: 'uppercase' }}>
                    {(() => { try { return numLetras(neto) + ' PESOS M/CTE'; } catch { return ''; } })()}
                  </span>
                </div>
              </div>

              <p style={{ ...styles.comprobanteLabel, marginBottom: '24px' }}>Recibí conforme:</p>
              <div style={{ borderTop: '1px solid #272525', width: '220px', paddingTop: '6px', marginTop: '8px' }}>
                <p style={{ fontSize: '11px', color: '#272525', margin: '0 0 2px 0', fontWeight: '600' }}>{emp.nombre}</p>
                <p style={{ fontSize: '11px', color: '#272525', margin: 0 }}>Fecha de recibido:</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal descarga */}
      {descargando && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={28} color="#0B662A" />
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
  stickyBar:          { position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'transparent', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  volverBtn:          { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#272525', fontFamily: 'Nunito, sans-serif', padding: 0 },
  btnDescargarSticky: { color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  card:               { backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px' },
  cardTitulo:         { fontSize: '16px', fontWeight: '800', color: '#272525', margin: '0 0 12px 0' },
  exitoMsg:           { fontSize: '14px', fontWeight: '700', color: '#0B662A', margin: '0 0 16px 0' },
  infoGrid:           { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoFila:           { display: 'flex', gap: '8px', alignItems: 'baseline' },
  infoLabel:          { fontSize: '13px', fontWeight: '700', color: '#272525', whiteSpace: 'nowrap' },
  infoValor:          { fontSize: '13px', color: '#272525' },
  divider:            { border: 'none', borderTop: '1px solid #E8E8E8', margin: '24px 0 0 0' },
  tableTitle:         { fontSize: '15px', fontWeight: '800', color: '#272525', margin: '0 0 16px 0' },
  tabla:              { width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '12px' },
  th:                 { backgroundColor: '#F0F0F0', fontWeight: '700', color: '#272525', padding: '8px 12px', textAlign: 'center', border: '1px solid #E0E0E0', whiteSpace: 'nowrap' },
  td:                 { padding: '7px 12px', textAlign: 'center', color: '#272525', border: '1px solid #E0E0E0', whiteSpace: 'nowrap' },
  trPar:              { backgroundColor: '#fff' },
  trImpar:            { backgroundColor: '#FAFAFA' },
  comprobante:        { border: '1px solid #D0D0D0', borderRadius: '4px', padding: '28px 32px', width: '100%', maxWidth: '680px', boxSizing: 'border-box', backgroundColor: '#fff' },
  comprobanteLabel:   { fontSize: '11px', color: '#272525', margin: 0, minWidth: '120px' },
  comprobanteValor:   { fontSize: '11px', color: '#272525', margin: 0 },
};
