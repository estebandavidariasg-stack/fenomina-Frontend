import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { FileText, ChevronLeft, UserRound, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmarCambiosModal from '../../../../../components/ConfirmarCambiosModal';
import MensajeModal from '../../../../../components/MensajeModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const MOCK_PROCESO = {
  nombreEmpresa: 'PRIIGO SAS',
  nit: '1.001.023.958',
  fechaGeneracion: '03-12-2026',
  periodo: '1 al 15 de Diciembre de 2026',
  mes: 'Diciembre',
  estadoProceso: 'Borrador',
  logoUrl: null, // reemplazar con URL del backend cuando esté disponible
};

const MOCK_EMPLEADOS = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    documento: '123456',
    cargo: 'Contador',
    salario: 2500000,
    diasLaborados: 30,
    novedades: [
      { id: 1, tipo: 'Hora extra diurna ordinaria', detalle: '20 horas × $13,021 = $260,416' },
      { id: 2, tipo: 'Incapacidad origen común', detalle: 'Del 10/03 al 12/03 (3 días)' },
    ],
  },
  {
    id: 2,
    nombre: 'María López',
    documento: '789012',
    cargo: 'Asistente',
    salario: 1500000,
    diasLaborados: 28,
    novedades: [],
  },
  {
    id: 3,
    nombre: 'Carlos Martínez',
    documento: '345678',
    cargo: 'Analista',
    salario: 2000000,
    diasLaborados: 30,
    novedades: [
      { id: 3, tipo: 'Bonificación por desempeño', detalle: '$150.000' },
    ],
  },
];

const formatMiles = (valor) => {
  const str = String(Math.round(valor));
  return '$' + str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function DesprendiblesNominaPage() {
  const navigate         = useNavigate();
  const { id, nominaId } = useParams();
  const { usuario }      = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  const [empleados, setEmpleados]                               = useState(MOCK_EMPLEADOS);
  const [busqueda, setBusqueda]                                 = useState('');
  const [expandidos, setExpandidos]                             = useState({});
  const [modal, setModal]                                       = useState(null);
  const [confirmarEliminarNovedad, setConfirmarEliminarNovedad] = useState(false);
  const [confirmarCerrar, setConfirmarCerrar]                   = useState(false);
  const [confirmarAnular, setConfirmarAnular]                   = useState(false);
  const [confirmarEliminar, setConfirmarEliminar]               = useState(false);
  const [novedadEliminar, setNovedadEliminar]                   = useState(null);
  const [hoverCerrar, setHoverCerrar]                           = useState(false);
  const [hoverAnular, setHoverAnular]                           = useState(false);
  const [hoverEliminar, setHoverEliminar]                       = useState(false);
  const [hoverPDF, setHoverPDF]                                 = useState(false);
  const [descargando, setDescargando]                           = useState(false);
  const [fueAnulado, setFueAnulado]                             = useState(false);
  const empleadosFiltrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.documento.includes(busqueda)
  );

  const toggleExpandido = (empId) =>
    setExpandidos(prev => ({ ...prev, [empId]: !prev[empId] }));

  const handleEliminarNovedad = (empId, novedadId) => {
    setNovedadEliminar({ empId, novedadId });
    setConfirmarEliminarNovedad(true);
  };

  const handleConfirmarEliminarNovedad = () => {
    setEmpleados(empleados.map(e =>
      e.id === novedadEliminar.empId
        ? { ...e, novedades: e.novedades.filter(n => n.id !== novedadEliminar.novedadId) }
        : e
    ));
    setConfirmarEliminarNovedad(false);
    setModal('exito');
  };

  const handleEditarDias    = (empId)            => navigate(`/empresas/${id}/nominas/${nominaId}/novedades?empleado=${empId}&tipo=dias`);
  const handleEditarNovedad = (empId, novedadId) => navigate(`/empresas/${id}/nominas/${nominaId}/novedades?empleado=${empId}&novedad=${novedadId}`);
  const handleAgregarNovedad= (empId)            => navigate(`/empresas/${id}/nominas/${nominaId}/novedades?empleado=${empId}`);

  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    let y = 14;

    // Logo en el reporte (solo si existe URL del backend)
    if (MOCK_PROCESO.logoUrl) {
      doc.addImage(MOCK_PROCESO.logoUrl, 'PNG', 14, y, 30, 30);
      y += 34;
    }

    // Encabezado
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Desprendibles Nómina', 14, y); y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Empresa: ${MOCK_PROCESO.nombreEmpresa}`, 14, y); y += 6;
    doc.text(`NIT: ${MOCK_PROCESO.nit}`, 14, y); y += 6;
    doc.text(`Periodo: ${MOCK_PROCESO.periodo}`, 14, y); y += 6;
    doc.text(`Mes: ${MOCK_PROCESO.mes}`, 14, y); y += 6;
    doc.text(`Estado: ${MOCK_PROCESO.estadoProceso}`, 14, y); y += 10;

    // Tabla
    const filas = empleados.flatMap(e => {
      const base = [e.nombre, e.documento, e.cargo, formatMiles(e.salario), String(e.diasLaborados)];
      if (e.novedades.length === 0) return [[...base, '-', '-']];
      return e.novedades.map(n => [...base, n.tipo, n.detalle]);
    });

    autoTable(doc, {
      startY: y,
      head: [['Nombre', 'Documento', 'Cargo', 'Salario', 'Días', 'Tipo novedad', 'Detalle']],
      body: filas,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [11, 102, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    setDescargando(true);
    setTimeout(() => {
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
          <div>
            <p style={styles.perfilNombre}>{nombre}</p>
            <p style={styles.perfilCargo}>{cargo}</p>
          </div>
        </div>
      </div>

      {/* Volver */}
      <button style={styles.volverBtn} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} color="#272525" />
        <span>Volver</span>
      </button>

      {/* Info del proceso */}
      <div style={styles.card}>
        <h3 style={styles.cardTitulo}>Desprendibles Nómina</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nombre Empresa:</span><span style={styles.infoValor}>{MOCK_PROCESO.nombreEmpresa}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Nit:</span><span style={styles.infoValor}>{MOCK_PROCESO.nit}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Fecha de Generación de Reporte:</span><span style={styles.infoValor}>{MOCK_PROCESO.fechaGeneracion}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Periodo:</span><span style={styles.infoValor}>{MOCK_PROCESO.periodo}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Mes:</span><span style={styles.infoValor}>{MOCK_PROCESO.mes}</span></div>
          <div style={styles.infoFila}><span style={styles.infoLabel}>Estado proceso:</span><span style={styles.infoValor}>{MOCK_PROCESO.estadoProceso}</span></div>
        </div>
      </div>

      {/* Buscador */}
      <div style={styles.searchCard}>
        <div style={styles.searchBox}>
          <Search size={14} color="#A3A3A3" />
          <input
            style={styles.searchInput}
            placeholder="Buscar empleado por nombre o documento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Cards empleados */}
      <div style={styles.empleadosBox}>
        {empleadosFiltrados.map((emp) => {
          const expandido = expandidos[emp.id] ?? true;
          return (
            <div key={emp.id} style={styles.empCard}>
              <div style={styles.empHeader}>
                <div>
                  <span style={styles.empNombre}>{emp.nombre}</span>
                  <span style={styles.empDoc}> ({emp.documento})</span>
                </div>
                <button style={styles.iconBtn} onClick={() => toggleExpandido(emp.id)}>
                  {expandido ? <ChevronUp size={16} color="#A3A3A3" /> : <ChevronDown size={16} color="#A3A3A3" />}
                </button>
              </div>

              {expandido && (
                <>
                  <div style={styles.empInfo}>
                    <span style={styles.empDetalle}>Cargo: {emp.cargo}</span>
                    <span style={styles.empSeparador}>|</span>
                    <span style={styles.empDetalle}>Salario: {formatMiles(emp.salario)}</span>
                  </div>

                  <div style={styles.diasRow}>
                    <span style={styles.empDetalle}>Días laborados: <strong>{emp.diasLaborados}</strong></span>
                    <button style={styles.btnIconoVerde} onClick={() => handleEditarDias(emp.id)} title="Editar días laborados">
                      <Pencil size={13} color="#0B662A" />
                    </button>
                  </div>

                  <div style={styles.novedadesBox}>
                    <p style={styles.novedadesTitulo}>Novedades registradas ({emp.novedades.length})</p>
                    {emp.novedades.length === 0 ? (
                      <p style={styles.sinNovedades}>No hay novedades registradas</p>
                    ) : (
                      emp.novedades.map((nov) => (
                        <div key={nov.id} style={styles.novedadFila}>
                          <div style={{ flex: 1 }}>
                            <p style={styles.novedadTipo}>✓ {nov.tipo}</p>
                            <p style={styles.novedadDetalle}>{nov.detalle}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button style={styles.btnAccionNovedad} onClick={() => handleEditarNovedad(emp.id, nov.id)}>Editar</button>
                            <button style={{ ...styles.btnAccionNovedad, ...styles.btnEliminarNovedad }} onClick={() => handleEliminarNovedad(emp.id, nov.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button style={styles.btnAgregarNovedad} onClick={() => handleAgregarNovedad(emp.id)}>
                    <Plus size={13} color="#0B662A" />
                    <span>Agregar novedad</span>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Descargar PDF */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <button
          style={{ ...styles.btnPDF, background: hoverPDF ? 'linear-gradient(135deg, #0B662A, #1a9e45)' : '#0B662A', transition: 'background 0.3s ease' }}
          onMouseEnter={() => setHoverPDF(true)}
          onMouseLeave={() => setHoverPDF(false)}
          onClick={handleDescargarPDF}
        >
          Descargar reporte en PDF
        </button>
      </div>

      {/* Acciones */}
      <div style={styles.accionesBar}>
        <button
          style={{ ...styles.btnCerrar, background: hoverCerrar ? 'linear-gradient(135deg, #0B662A, #1a9e45)' : '#0B662A', transition: 'background 0.3s ease' }}
          onMouseEnter={() => setHoverCerrar(true)}
          onMouseLeave={() => setHoverCerrar(false)}
          onClick={() => navigate(`/empresas/${id}/nominas/${nominaId}/liquidar`)}
        >
          Cerrar proceso
        </button>
        <button
          style={{ ...styles.btnAnular, transition: 'background 0.3s ease', ...(hoverAnular ? { backgroundColor: '#f5f5f5' } : {}) }}
          onMouseEnter={() => setHoverAnular(true)}
          onMouseLeave={() => setHoverAnular(false)}
          onClick={() => setConfirmarAnular(true)}
        >
          Anular
        </button>
        <button
          style={{ ...styles.btnEliminar, transition: 'background 0.3s ease', ...(hoverEliminar ? { backgroundColor: '#FFF5F5' } : {}) }}
          onMouseEnter={() => setHoverEliminar(true)}
          onMouseLeave={() => setHoverEliminar(false)}
          onClick={() => setConfirmarEliminar(true)}
        >
          Eliminar
        </button>
      </div>

      {/* Modales */}
      <ConfirmarCambiosModal visible={confirmarEliminarNovedad} onCancelar={() => setConfirmarEliminarNovedad(false)} onConfirmar={handleConfirmarEliminarNovedad} titulo="¿Deseas eliminar esta novedad?" descripcion="La novedad será removida del desprendible de este empleado." />
      <ConfirmarCambiosModal visible={confirmarCerrar} onCancelar={() => setConfirmarCerrar(false)} onConfirmar={() => { setConfirmarCerrar(false); setModal('exito'); }} titulo="¿Deseas cerrar este proceso de nómina?" descripcion="Al cerrar el proceso, el estado cambiará a Cerrado y no podrá editarse." />
      <ConfirmarCambiosModal visible={confirmarAnular} onCancelar={() => setConfirmarAnular(false)} onConfirmar={() => { setConfirmarAnular(false); setFueAnulado(true); setModal('exito'); }}titulo="¿Estás seguro de que deseas anular este proceso?" descripcion="Esta acción es irreversible. Una vez anulado, el proceso no podrá volver a un estado activo." tipo="error" />
      <ConfirmarCambiosModal visible={confirmarEliminar} onCancelar={() => setConfirmarEliminar(false)} onConfirmar={() => { setConfirmarEliminar(false); navigate(-1); }} titulo="¿Deseas eliminar este proceso de nómina?" descripcion="Esta acción registrará la fecha de eliminación y el proceso dejará de mostrarse en la lista." />
      <MensajeModal tipo={modal} onClose={() => { setModal(null); if (fueAnulado) navigate(-1); }} />

      {/* Modal descarga en curso */}
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
  volverBtn:          { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#272525', fontFamily: 'Nunito, sans-serif', padding: 0 },
  card:               { backgroundColor: '#fff', borderRadius: '16px', padding: '28px 32px' },
  cardTitulo:         { fontSize: '16px', fontWeight: '800', color: '#272525', margin: '0 0 20px 0' },
  infoGrid:           { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoFila:           { display: 'flex', gap: '8px', alignItems: 'baseline' },
  infoLabel:          { fontSize: '13px', fontWeight: '700', color: '#272525', whiteSpace: 'nowrap' },
  infoValor:          { fontSize: '13px', color: '#272525' },
  searchCard:         { backgroundColor: '#fff', borderRadius: '12px', padding: '14px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  searchBox:          { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #0B662A', borderRadius: '8px', padding: '8px 14px', backgroundColor: '#fff', width: '100%' },
  searchInput:        { border: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'Nunito, sans-serif' },
  empleadosBox:       { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  empCard:            { backgroundColor: '#fff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #F0F0F0' },
  empHeader:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  empNombre:          { fontSize: '14px', fontWeight: '800', color: '#272525' },
  empDoc:             { fontSize: '13px', color: '#A3A3A3', fontWeight: '400' },
  empInfo:            { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  empDetalle:         { fontSize: '13px', color: '#272525' },
  empSeparador:       { color: '#D0D0D0', fontSize: '13px' },
  diasRow:            { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  novedadesBox:       { backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px', border: '1px solid #F0F0F0' },
  novedadesTitulo:    { fontSize: '12px', fontWeight: '700', color: '#272525', margin: '0 0 10px 0' },
  sinNovedades:       { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  novedadFila:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F0F0' },
  novedadTipo:        { fontSize: '12px', fontWeight: '700', color: '#272525', margin: '0 0 2px 0' },
  novedadDetalle:     { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  btnAccionNovedad:   { fontSize: '11px', fontWeight: '700', color: '#0B662A', backgroundColor: '#F0FAF4', border: '1px solid #C3E6CC', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' },
  btnEliminarNovedad: { color: '#E53E3E', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2' },
  btnAgregarNovedad:  { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed #0B662A', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#0B662A', fontFamily: 'Nunito, sans-serif' },
  btnIconoVerde:      { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtn:            { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' },
  btnPDF:             { color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  accionesBar:        { display: 'flex', gap: '12px', justifyContent: 'center', paddingBottom: '16px', flexWrap: 'wrap' },
  btnCerrar:          { flex: 1, maxWidth: '220px', backgroundColor: '#0B662A', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  btnAnular:          { flex: 1, maxWidth: '220px', backgroundColor: '#fff', color: '#272525', border: '1px solid #D0D0D0', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  btnEliminar:        { flex: 1, maxWidth: '220px', backgroundColor: '#fff', color: '#E53E3E', border: '1px solid #E53E3E', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
};
