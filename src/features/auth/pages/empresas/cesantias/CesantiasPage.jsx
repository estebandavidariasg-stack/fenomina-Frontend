import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../../store/authStore';
import { Coins, Search, ChevronLeft, ChevronDown, UserRound, Pencil, Trash2, Upload } from 'lucide-react';
import ConfirmarCambiosModal from '../../../../../components/ConfirmarCambiosModal';
import MensajeModal from '../../../../../components/MensajeModal';


const MOCK_PERIODOS = [
  { id: 1,  periodo: '2025-01-15', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-01-20', estado: 'Borrador' },
  { id: 2,  periodo: '2025-01-15', empleadosIncluidos: 13, totalNeto: 224000, fechaCreacion: '2025-01-20', estado: 'Borrador' },
  { id: 3,  periodo: '2025-01-15', empleadosIncluidos: 14, totalNeto: 224000, fechaCreacion: '2025-01-21', estado: 'Cerrado' },
  { id: 4,  periodo: '2025-01-15', empleadosIncluidos: 14, totalNeto: 224000, fechaCreacion: '2025-01-21', estado: 'Borrador' },
  { id: 5,  periodo: '2025-01-15', empleadosIncluidos: 14, totalNeto: 224000, fechaCreacion: '2025-01-22', estado: 'Pagado' },
  { id: 6,  periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-03', estado: 'Borrador' },
  { id: 7,  periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-03', estado: 'Borrador' },
  { id: 8,  periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-04', estado: 'Cerrado' },
  { id: 9,  periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-04', estado: 'Borrador' },
  { id: 10, periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-05', estado: 'Pendiente por pagar' },
  { id: 11, periodo: '2025-01-30', empleadosIncluidos: 15, totalNeto: 224000, fechaCreacion: '2025-02-05', estado: 'Borrador' },
];

const TABS = ['Borrador', 'Cerrado', 'Pendiente por pagar', 'Pagado', 'Anulado'];
const PAGE_SIZE = 10;

const OPCIONES_POR_ESTADO = {
  'Borrador':            ['Borrador', 'Cerrado', 'Anulado'],
  'Cerrado':             ['Cerrado', 'Borrador', 'Anulado'],
  'Pendiente por pagar': ['Pendiente por pagar', 'Pagado', 'Anulado'],
  'Pagado':              ['Pagado', 'Anulado'],
  'Anulado':             ['Anulado'],
};

const formatMiles = (valor) => '$' + String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function EstadoSelect({ valor, onChange }) {
  const opciones = OPCIONES_POR_ESTADO[valor] ?? ['Borrador'];
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        style={{ border: '1px solid #D0D0D0', borderRadius: '8px', padding: '6px 28px 6px 10px', fontSize: '12px', fontFamily: 'Nunito, sans-serif', outline: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundColor: '#fff', color: '#272525', cursor: 'pointer', backgroundImage: 'none' }}>
        {opciones.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      <ChevronDown size={12} color="#A3A3A3" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

export default function CesantiasPage() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const { usuario } = useAuthStore();

  const nombre = `${usuario?.nombresUsuario ?? ''} ${usuario?.apellidosUsuario ?? ''}`.trim();
  const cargo  = usuario?.cargoUsuario ?? '';

  const [tab, setTab]                             = useState('Borrador');
  const [busqueda, setBusqueda]                   = useState('');
  const [pagina, setPagina]                       = useState(0);
  const [periodos, setPeriodos]                   = useState(MOCK_PERIODOS);
  const [modal, setModal]                         = useState(null);
  const [confirmarEstado, setConfirmarEstado]     = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [confirmarAnulado, setConfirmarAnulado]   = useState(false);
  const [cambioEstado, setCambioEstado]           = useState({ periodoId: null, nuevoEstado: null });
  const [periodoEliminar, setPeriodoEliminar]     = useState(null);
  const [hoverLiquidar, setHoverLiquidar]         = useState(false);

  const periodosFiltrados = periodos.filter(p => !p.deletedAt && p.estado === tab && p.periodo.includes(busqueda));
  const totalPaginas      = Math.max(1, Math.ceil(periodosFiltrados.length / PAGE_SIZE));
  const periodosPagina    = periodosFiltrados.slice(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE);

  const handleEstadoChange = (periodoId, nuevoEstado) => {
    setCambioEstado({ periodoId, nuevoEstado });
    if (nuevoEstado === 'Anulado') setConfirmarAnulado(true);
    else setConfirmarEstado(true);
  };

  const handleConfirmarEstado = () => {
    setPeriodos(periodos.map(p => p.id === cambioEstado.periodoId ? { ...p, estado: cambioEstado.nuevoEstado } : p));
    setConfirmarEstado(false);
    setModal('exito');
  };

  const handleEliminar = (periodo) => { setPeriodoEliminar(periodo); setConfirmarEliminar(true); };

  const handleConfirmarEliminar = () => {
    setPeriodos(periodos.map(p => p.id === periodoEliminar.id ? { ...p, deletedAt: new Date().toISOString() } : p));
    setConfirmarEliminar(false);
    setModal('exito');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={18} color="#0B662A" />
          <div>
            <h2 style={styles.titulo}>Cesantías e Intereses</h2>
            <p style={styles.subtitulo}>Gestiona la liquidación de cesantías e intereses para cada uno de los empleados asociados a la empresa</p>
          </div>
        </div>
        <div style={styles.perfilBox}>
          <div style={styles.avatar}><UserRound size={22} color="#A3A3A3" /></div>
          <div><p style={styles.perfilNombre}>{nombre}</p><p style={styles.perfilCargo}>{cargo}</p></div>
        </div>
      </div>

      <button style={styles.volverBtn} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} color="#272525" /><span>Volver</span>
      </button>

      <div style={styles.toolbarCard}>
        <div>
          <p style={styles.totalNum}>{periodosFiltrados.length}</p>
          <p style={styles.totalLabel}>Total reportes</p>
        </div>
        <div style={styles.filtrosBox}>
          <div style={styles.searchBox}>
            <Search size={14} color="#A3A3A3" />
            <input style={styles.searchInput} placeholder="Buscar cesantía por palabra clave" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }} />
          </div>
        </div>
      </div>

      <div style={styles.addBar}>
        <span style={styles.addLabel}>Generar reportes de cesantías e intereses</span>
        <button
          style={{ ...styles.btnLiquidar, background: hoverLiquidar ? 'linear-gradient(135deg, #0B662A, #1a9e45)' : '#0B662A', transition: 'background 0.3s ease' }}
          onMouseEnter={() => setHoverLiquidar(true)} onMouseLeave={() => setHoverLiquidar(false)}
          onClick={() => navigate(`/empresas/${id}/cesantias/generar-reporte`)}
        >
          Nuevo proceso de liquidación
        </button>
      </div>

      <div style={styles.tabsBox}>
        {TABS.map((t) => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActivo : {}) }} onClick={() => { setTab(t); setPagina(0); }}>{t}</button>
        ))}
      </div>

      <div style={styles.card}>
        <p style={styles.tableTitle}>Histórico Total de Cesantías e Intereses por Periodo</p>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Periodo</th>
                <th style={styles.th}>Empleados incluidos</th>
                <th style={styles.th}>Total neto</th>
                <th style={styles.th}>Fecha de creación proceso</th>
                <th style={styles.th}>Estado</th>
                {(tab === 'Borrador' || tab === 'Cerrado') && <th style={styles.th}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {periodosPagina.length === 0 ? (
                <tr><td colSpan={tab === 'Borrador' || tab === 'Cerrado' ? 6 : 5} style={{ textAlign: 'center', padding: '20px', color: '#A3A3A3' }}>Sin resultados</td></tr>
              ) : (
                periodosPagina.map((p, index) => (
                  <tr key={p.id} style={index % 2 === 0 ? styles.trPar : styles.trImpar}>
                    <td style={styles.td}>{p.periodo}</td>
                    <td style={styles.td}>{p.empleadosIncluidos}</td>
                    <td style={styles.td}>{formatMiles(p.totalNeto)}</td>
                    <td style={styles.td}>{p.fechaCreacion}</td>
                    <td style={styles.td}>
                      {p.estado === 'Anulado'
                        ? <span style={styles.estadoTexto}>{p.estado}</span>
                        : <EstadoSelect valor={p.estado} onChange={(v) => handleEstadoChange(p.id, v)} />}
                    </td>
                    {(tab === 'Borrador' || tab === 'Cerrado') && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                          {p.estado === 'Borrador' && (
                            <>
                              <button style={styles.iconBtn} onClick={() => navigate(`/empresas/${id}/cesantias/${p.id}/desprendibles`)} title="Editar"><Pencil size={16} color="#0B662A" /></button>
                              <button style={styles.iconBtn} onClick={() => handleEliminar(p)} title="Eliminar"><Trash2 size={16} color="#E53E3E" /></button>
                            </>
                          )}
                          {p.estado === 'Cerrado' && (
                            <button style={styles.iconBtn} onClick={() => navigate(`/empresas/${id}/cesantias/${p.id}/liquidar`)} title="Liquidar"><Upload size={16} color="#0B662A" /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={styles.paginacion}>
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button key={i} onClick={() => setPagina(i)} style={{ ...styles.pageBtn, ...(pagina === i ? styles.pageBtnActivo : {}) }}>{i + 1}</button>
          ))}
          <button onClick={() => setPagina(totalPaginas - 1)} style={styles.pageBtn} disabled={pagina === totalPaginas - 1}>{'>>'}</button>
        </div>
      </div>

      <ConfirmarCambiosModal visible={confirmarEstado} onCancelar={() => setConfirmarEstado(false)} onConfirmar={handleConfirmarEstado} titulo="¿Deseas cambiar el estado del proceso?" descripcion="Una vez confirmes, el estado del proceso será actualizado." />
      <ConfirmarCambiosModal visible={confirmarAnulado} onCancelar={() => setConfirmarAnulado(false)}
        onConfirmar={() => { setPeriodos(periodos.map(p => p.id === cambioEstado.periodoId ? { ...p, estado: 'Anulado' } : p)); setConfirmarAnulado(false); setModal('exito'); }}
        titulo="¿Estás seguro de que deseas anular este proceso?" descripcion="Esta acción es irreversible." tipo="error" />
      <ConfirmarCambiosModal visible={confirmarEliminar} onCancelar={() => setConfirmarEliminar(false)} onConfirmar={handleConfirmarEliminar} titulo="¿Deseas eliminar este proceso?" descripcion="Esta acción registrará la fecha de eliminación." />
      <MensajeModal tipo={modal} onClose={() => setModal(null)} />
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
  volverBtn:    { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#272525', fontFamily: 'Nunito, sans-serif', padding: 0 },
  totalNum:     { fontSize: '28px', fontWeight: '800', color: '#272525', margin: 0 },
  totalLabel:   { fontSize: '12px', color: '#A3A3A3', margin: 0 },
  addBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px' },
  addLabel:     { fontSize: '15px', fontWeight: '700', color: '#272525' },
  btnLiquidar:  { color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  tabsBox:      { display: 'flex', borderBottom: '1px solid #E8E8E8' },
  tab:          { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '10px 20px', fontSize: '14px', fontWeight: '600', color: '#A3A3A3', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' },
  tabActivo:    { color: '#0B662A', borderBottom: '2px solid #0B662A' },
  card:         { backgroundColor: '#fff', borderRadius: '16px', padding: '24px' },
  tableTitle:   { fontSize: '15px', fontWeight: '800', color: '#272525', margin: '0 0 16px 0' },
  tableWrapper: { overflowX: 'auto', width: '100%' },
  table:        { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  th:           { fontSize: '12px', fontWeight: '700', color: '#A3A3A3', padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #F0F0F0', whiteSpace: 'nowrap' },
  td:           { fontSize: '13px', color: '#272525', padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' },
  trPar:        { backgroundColor: '#fff' },
  trImpar:      { backgroundColor: '#FAFAFA' },
  estadoTexto:  { fontSize: '12px', color: '#272525' },
  paginacion:   { display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' },
  pageBtn:      { width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #D0D0D0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff', color: '#272525', fontFamily: 'Nunito, sans-serif' },
  pageBtnActivo:{ backgroundColor: '#0B662A', color: '#fff', border: '1px solid #0B662A' },
  toolbarCard:  { backgroundColor: '#fff', borderRadius: '12px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filtrosBox:   { display: 'flex', alignItems: 'center', gap: '12px' },
  searchBox:    { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #0B662A', borderRadius: '8px', padding: '8px 14px', backgroundColor: '#fff', width: '380px' },
  searchInput:  { border: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'Nunito, sans-serif' },
  iconBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' },
};
