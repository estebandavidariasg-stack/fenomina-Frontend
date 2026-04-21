import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { FileText, ChevronLeft, UserRound } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const MOCK_PROCESO = {
  nombreEmpresa:   'PRIIGO SAS',
  nit:             '901.331.853-4',
  fechaGeneracion: '03-12-2026',
  periodo:         '1 al 15 de Diciembre de 2026',
  mes:             'Diciembre',
  estado:          'Pendiente por pagar',
  logoUrl:         null,
};

const MOCK_EMPLEADOS = [
  {
    id: 1, nombre: 'Juan Pérez', documento: '123456', fecha: '30 de diciembre de 2025',
    periodo: 'Del 01 al 15 de diciembre de 2025', mes: 'DICIEMBRE', salarioBasico: 2500000,
    conceptos: [
      { concepto: 'SALARIO BASICO',                             dias: 15,   devengos: 2500000, deducciones: null },
      { concepto: 'INCAPACIDAD',                                dias: null, devengos: null,    deducciones: null },
      { concepto: 'AUXILIO DE TRANSPORTE',                      dias: 15,   devengos: 100000,  deducciones: null },
      { concepto: 'HORAS EXTRA Y RECARGOS',                     dias: null, devengos: 260416,  deducciones: null },
      { concepto: 'BONIFICACIONES SALARIALES',                  dias: null, devengos: null,    deducciones: null },
      { concepto: 'OTROS PAGOS QUE CONSTITUYEN SALARIO',        dias: null, devengos: null,    deducciones: null },
      { concepto: 'PRIMAS, BENEFICIOS O AUXILIOS EXTRALEGALES', dias: null, devengos: null,    deducciones: null },
      { concepto: 'OTROS PAGOS QUE NO CONSTITUYEN SALARIO',     dias: null, devengos: null,    deducciones: null },
      { concepto: 'SALUD TRABAJADOR',                           dias: null, devengos: null,    deducciones: 100000 },
      { concepto: 'PENSIÓN TRABAJADOR',                         dias: null, devengos: null,    deducciones: 100000 },
      { concepto: 'OTROS CONCEPTOS A DEDUCIR',                  dias: null, devengos: null,    deducciones: null },
    ],
  },
  {
    id: 2, nombre: 'María López', documento: '789012', fecha: '30 de diciembre de 2025',
    periodo: 'Del 01 al 15 de diciembre de 2025', mes: 'DICIEMBRE', salarioBasico: 1500000,
    conceptos: [
      { concepto: 'SALARIO BASICO',                             dias: 15,   devengos: 1500000, deducciones: null },
      { concepto: 'INCAPACIDAD',                                dias: null, devengos: null,    deducciones: null },
      { concepto: 'AUXILIO DE TRANSPORTE',                      dias: 15,   devengos: 100000,  deducciones: null },
      { concepto: 'HORAS EXTRA Y RECARGOS',                     dias: null, devengos: null,    deducciones: null },
      { concepto: 'BONIFICACIONES SALARIALES',                  dias: null, devengos: null,    deducciones: null },
      { concepto: 'OTROS PAGOS QUE CONSTITUYEN SALARIO',        dias: null, devengos: null,    deducciones: null },
      { concepto: 'PRIMAS, BENEFICIOS O AUXILIOS EXTRALEGALES', dias: null, devengos: null,    deducciones: null },
      { concepto: 'OTROS PAGOS QUE NO CONSTITUYEN SALARIO',     dias: null, devengos: null,    deducciones: null },
      { concepto: 'SALUD TRABAJADOR',                           dias: null, devengos: null,    deducciones: 60000 },
      { concepto: 'PENSIÓN TRABAJADOR',                         dias: null, devengos: null,    deducciones: 60000 },
      { concepto: 'OTROS CONCEPTOS A DEDUCIR',                  dias: null, devengos: null,    deducciones: null },
    ],
  },
];

const fmt = (v) => v != null ? '$' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

export default function ResultadoLiquidacionPage() {
  const navigate         = useNavigate();
  const { id, nominaId } = useParams();
  const { usuario }      = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  const [hoverDescargar, setHoverDescargar] = useState(false);
  const [descargando, setDescargando]       = useState(false);

  const calcularTotales = (emp) => {
    const totalDevengos    = emp.conceptos.reduce((s, c) => s + (c.devengos    ?? 0), 0);
    const totalDeducciones = emp.conceptos.reduce((s, c) => s + (c.deducciones ?? 0), 0);
    return { totalDevengos, totalDeducciones, neto: totalDevengos - totalDeducciones };
  };

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => {
      const doc = new jsPDF();

      MOCK_EMPLEADOS.forEach((emp, idx) => {
        if (idx > 0) doc.addPage();
        let y = 14;

        if (MOCK_PROCESO.logoUrl) doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, y, 25, 25);

        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text(MOCK_PROCESO.nombreEmpresa, 105, y + 8, { align: 'center' });
        doc.setFontSize(10); doc.setFont(undefined, 'normal');
        doc.text(`NIT. ${MOCK_PROCESO.nit}`, 105, y + 14, { align: 'center' });
        y += 30;

        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text('DESPRENDIBLE PAGO DE NÓMINA', 105, y, { align: 'center' });
        y += 10;

        doc.setFontSize(9); doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${emp.fecha}`, 14, y);
        doc.text(`Salario básico: ${fmt(emp.salarioBasico)}`, 140, y); y += 6;
        doc.text(`Periodo: ${emp.periodo}`, 14, y); y += 6;
        doc.text(`Nombre: ${emp.nombre}`, 14, y); y += 6;
        doc.text(`Doc. Identidad: ${emp.documento}`, 14, y); y += 6;
        doc.text(`Mes: ${emp.mes}`, 14, y); y += 8;

        const { totalDevengos, totalDeducciones, neto } = calcularTotales(emp);
        const body = emp.conceptos.map(c => [
          c.concepto,
          c.dias != null ? String(c.dias) : '',
          c.devengos    != null ? fmt(c.devengos)    : '',
          c.deducciones != null ? fmt(c.deducciones) : '',
        ]);
        body.push(
          [{ content: 'SUBTOTAL',     styles: { fontStyle: 'bold' } }, '', fmt(totalDevengos), fmt(totalDeducciones)],
          [{ content: 'NETO A PAGAR', styles: { fontStyle: 'bold', textColor: [11, 102, 42] } }, '', fmt(neto), ''],
        );

        autoTable(doc, {
          startY: y,
          head: [['CONCEPTO', 'DÍAS', 'DEVENGOS', 'DEDUCCIONES']],
          body,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [11, 102, 42], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        });

        const finalY = doc.lastAutoTable.finalY + 16;
        doc.setFontSize(9);
        doc.text('_______________________', 140, finalY);
        doc.text('Firma del trabajador', 148, finalY + 6);
      });

      doc.save(`desprendibles_${MOCK_PROCESO.periodo.replace(/ /g, '_')}.pdf`);
      setDescargando(false);
    }, 100);
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#0B662A" />
          <div>
            <h2 style={styles.titulo}>Desprendibles Nómina</h2>
            <p style={styles.subtitulo}>Ver desprendibles de nómina</p>
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
        <p style={styles.exitoMsg}>¡Nómina liquidada exitosamente!</p>
        <div style={styles.infoGrid}>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nombre Empresa:</span><span style={styles.infoValor}>{MOCK_PROCESO.nombreEmpresa}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nit:</span><span style={styles.infoValor}>{MOCK_PROCESO.nit}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Fecha de Generación de Reporte:</span><span style={styles.infoValor}>{MOCK_PROCESO.fechaGeneracion}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Periodo:</span><span style={styles.infoValor}>{MOCK_PROCESO.periodo}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Mes:</span><span style={styles.infoValor}>{MOCK_PROCESO.mes}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Estado:</span><span style={styles.infoValor}>{MOCK_PROCESO.estado}</span></div>
        </div>
        <hr style={styles.divider} />
      </div>

      {/* Desprendibles por empleado */}
      {MOCK_EMPLEADOS.map((emp) => {
        const { totalDevengos, totalDeducciones, neto } = calcularTotales(emp);
        return (
          <div key={emp.id} style={styles.desprendibleCard}>
            <div style={styles.desprendibleHeader}>
              <div style={styles.logoBox}>
                {MOCK_PROCESO.logoUrl
                  ? <img src={MOCK_PROCESO.logoUrl} alt="logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                  : <div style={styles.logoPlaceholder}><span style={{ fontSize: '10px', color: '#A3A3A3' }}>LOGO</span></div>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={styles.empresaNombre}>{MOCK_PROCESO.nombreEmpresa}</p>
                <p style={styles.empresaNit}>NIT. {MOCK_PROCESO.nit}</p>
              </div>
              <div style={{ width: '60px' }} />
            </div>

            <p style={styles.desprendibleTitulo}>DESPRENDIBLE PAGO DE NÓMINA</p>

            <div style={styles.empInfoGrid}>
              <div>
                <p style={styles.empInfoFila}><strong>Fecha</strong> &nbsp; {emp.fecha}</p>
                <p style={styles.empInfoFila}><strong>Periodo</strong> &nbsp; {emp.periodo}</p>
                <p style={styles.empInfoFila}><strong>Nombre</strong> &nbsp; {emp.nombre}</p>
                <p style={styles.empInfoFila}><strong>Doc. Identidad</strong> &nbsp; {emp.documento}</p>
                <p style={styles.empInfoFila}><strong>Mes</strong> &nbsp; {emp.mes}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={styles.empInfoFila}><strong>Salario básico</strong> &nbsp; {fmt(emp.salarioBasico)}</p>
                <p style={{ ...styles.empInfoFila, marginTop: '32px', color: '#A3A3A3', fontSize: '11px' }}>Firma del trabajador</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, textAlign: 'left' }}>CONCEPTO</th>
                    <th style={styles.th}>DÍAS</th>
                    <th style={styles.th}>DEVENGOS</th>
                    <th style={styles.th}>DEDUCCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {emp.conceptos.map((c, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                      <td style={{ ...styles.td, textAlign: 'left' }}>{c.concepto}</td>
                      <td style={styles.td}>{c.dias ?? ''}</td>
                      <td style={styles.td}>{c.devengos    != null ? fmt(c.devengos)    : ''}</td>
                      <td style={styles.td}>{c.deducciones != null ? fmt(c.deducciones) : ''}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#F0F0F0' }}>
                    <td style={{ ...styles.td, fontWeight: '700', textAlign: 'left' }}>SUBTOTAL</td>
                    <td style={styles.td} />
                    <td style={{ ...styles.td, fontWeight: '700' }}>{fmt(totalDevengos)}</td>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{fmt(totalDeducciones)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#E8F5EE' }}>
                    <td style={{ ...styles.td, fontWeight: '800', color: '#0B662A', textAlign: 'left' }}>NETO A PAGAR</td>
                    <td style={styles.td} />
                    <td style={{ ...styles.td, fontWeight: '800', color: '#0B662A' }}>{fmt(neto)}</td>
                    <td style={styles.td} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Modal descarga */}
      {descargando && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} color="#0B662A" />
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
  exitoMsg:           { fontSize: '14px', fontWeight: '700', color: '#0B662A', margin: '0 0 16px 0' },
  infoGrid:           { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoFila:           { display: 'flex', gap: '8px', alignItems: 'baseline' },
  infoLabel:          { fontSize: '13px', fontWeight: '700', color: '#272525', whiteSpace: 'nowrap' },
  infoValor:          { fontSize: '13px', color: '#272525' },
  divider:            { border: 'none', borderTop: '1px solid #E8E8E8', margin: '24px 0 0 0' },
  desprendibleCard:   { backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #E8E8E8' },
  desprendibleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  logoBox:            { width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoPlaceholder:    { width: '60px', height: '60px', border: '1px dashed #D0D0D0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empresaNombre:      { fontSize: '16px', fontWeight: '800', color: '#272525', margin: 0 },
  empresaNit:         { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  desprendibleTitulo: { fontSize: '13px', fontWeight: '800', color: '#272525', textAlign: 'center', margin: '0 0 16px 0', letterSpacing: '0.5px' },
  empInfoGrid:        { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' },
  empInfoFila:        { fontSize: '12px', color: '#272525', margin: '0 0 4px 0' },
  tabla:              { width: '100%', borderCollapse: 'collapse', minWidth: '500px', fontSize: '12px' },
  th:                 { backgroundColor: '#F0F0F0', fontWeight: '700', color: '#272525', padding: '8px 12px', textAlign: 'center', border: '1px solid #E0E0E0' },
  td:                 { padding: '7px 12px', textAlign: 'center', color: '#272525', border: '1px solid #E0E0E0' },
  trPar:              { backgroundColor: '#fff' },
  trImpar:            { backgroundColor: '#FAFAFA' },
};
