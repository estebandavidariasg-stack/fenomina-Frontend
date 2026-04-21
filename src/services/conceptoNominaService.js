import masterAxios from '../api/masterAxiosInstance';

const conceptoNominaService = {
  getConceptosContrato: () =>
    masterAxios.get('/api/master/conceptos-nomina/contrato'),
};

export default conceptoNominaService;