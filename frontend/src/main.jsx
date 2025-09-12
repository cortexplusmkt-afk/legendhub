import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import axios from 'axios'; // Importa o axios aqui

// --- O NOSSO "GPS" / "CAIXA-PRETA" ---
// Este código diz: "Axios, antes de você enviar QUALQUER requisição,
// por favor, me mostre ela em detalhes no console do navegador."
axios.interceptors.request.use(request => {
  console.log('--- INICIANDO REQUISIÇÃO AXIOS ---');
  console.log('URL:', request.url);
  console.log('HEADERS:', request.headers);
  console.log('---------------------------------');
  return request;
}, error => {
  return Promise.reject(error);
});
// --- FIM DO GPS ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);