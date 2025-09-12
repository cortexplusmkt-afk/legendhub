import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Este é o "GPS" que já tínhamos, agora no lugar certo.
api.interceptors.request.use(request => {
  console.log('--- INICIANDO REQUISIÇÃO AXIOS ---');
  console.log('URL:', request.baseURL + request.url);
  console.log('HEADERS:', request.headers);
  console.log('---------------------------------');
  return request;
});

export default api;