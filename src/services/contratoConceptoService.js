import masterAxios from '../api/masterAxiosInstance';

const contratoConceptoService = {
  crearConcepto: (dto) =>
    masterAxios.post('/api/master/contratos-concepto', dto),

  getConceptosByEmpleado: (empleadoId) =>
    masterAxios.get(`/api/master/empleados/${empleadoId}/conceptos`),

  eliminarConcepto: (id) =>
    masterAxios.delete(`/api/master/contratos-concepto/${id}`),

  actualizarConcepto: (id, dto) =>
    masterAxios.patch(`/api/master/contratos-concepto/${id}`, dto),
};

export default contratoConceptoService;