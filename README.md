# LegendHub

Plataforma full-stack para gestão operacional de participantes e eventos.

O LegendHub centraliza processos como cadastro, autenticação, check-in, organização de participantes, documentos e comunicação em uma única aplicação.

## Principais funcionalidades

- Autenticação de usuários e participantes
- Painel administrativo
- Gestão de participantes
- Check-in operacional
- Organização de grupos e famílias
- Upload e validação de documentos
- Importação e exportação de dados
- Comunicação via WhatsApp
- Atualizações em tempo real
- QR Codes
- Persistência em banco PostgreSQL

## Tecnologias

### Frontend

- React
- Vite
- Chakra UI
- Axios
- Socket.IO Client
- Framer Motion

### Backend

- Node.js
- Express
- PostgreSQL
- JWT
- Socket.IO
- Multer
- whatsapp-web.js
- XLSX
- CSV Parser

## Arquitetura

```text
legendhub/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       └── services/
│
└── frontend/
    └── src/
        ├── components/
        ├── api.js
        └── App.jsx
