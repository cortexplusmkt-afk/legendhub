require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');

// --- Importa TODOS os controllers ---
const adminController = require('./controllers/adminController');
const checkinController = require('./controllers/checkinController');
const medicalController = require('./controllers/medicalController');
const participantController = require('./controllers/participantController');
const userController = require('./controllers/userController');

// --- Importa os Middlewares ---
const authMiddleware = require('./middleware/authMiddleware');
const participantAuthMiddleware = require('./middleware/participantAuthMiddleware');
const whatsappService = require('./services/whatsappService'); // Importa o serviço do WhatsApp

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io
const io = new Server(server, { 
  path: '/socket.io', 
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  } 
});

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    req.io = io; // Disponibiliza o 'io' para todos os controllers
    next();
});

// ===============================================
// === DEFINIÇÃO DE TODAS AS ROTAS ===
// ===============================================
app.post('/auth/register', userController.registerUser);
app.post('/auth/login', userController.loginUser);

app.post('/participants/login', participantController.participantLogin);
app.get('/participants/profile', participantAuthMiddleware, participantController.getProfile);
app.put('/participants/profile', participantAuthMiddleware, participantController.updateProfile);
app.post('/participants/medical-document', participantAuthMiddleware, upload.single('document'), participantController.uploadMedicalDocument);

const adminRouter = express.Router();
adminRouter.use(authMiddleware);
adminRouter.get('/dashboard-stats', adminController.getDashboardStats);
adminRouter.get('/export-links', adminController.exportParticipantLinks);
adminRouter.post('/import', upload.single('file'), adminController.importParticipants);
adminRouter.get('/users', adminController.getAllUsers);
adminRouter.post('/users', adminController.createUser);
adminRouter.delete('/users/:userIdToDelete', adminController.deleteUser);
adminRouter.post('/reset-data', adminController.resetEventData);
adminRouter.get('/emergency-contacts', adminController.getEmergencyContacts);
adminRouter.post('/assign-families', adminController.autoAssignFamilies);
adminRouter.post('/send-whatsapp', adminController.sendBulkWhatsapp); // Rota do Disparo
app.use('/admin', adminRouter);

const medicalRouter = express.Router();
medicalRouter.use(authMiddleware);
medicalRouter.get('/pending', medicalController.getPendingSubmissions);
medicalRouter.post('/validate/:participantId', medicalController.validateDocument);
medicalRouter.post('/approve-manually/:participantId', medicalController.manualApprove);
app.use('/medical', medicalRouter);

const checkinRouter = express.Router();
checkinRouter.use(authMiddleware);
checkinRouter.get('/all', checkinController.getAllParticipants);
checkinRouter.get('/family-counts', checkinController.getFamilyCounts);
checkinRouter.put('/:participantId/family', checkinController.updateFamilyNumber);
checkinRouter.put('/:participantId/edit', checkinController.updateParticipantByStaff);
checkinRouter.post('/:participantId', checkinController.performCheckin);
app.use('/checkin', checkinRouter);

// ===============================================
// --- Lógica do Socket.io e Inicialização ---
// ===============================================
io.on('connection', (socket) => {
  console.log('Um usuário conectou ao socket:', socket.id);
  socket.emit('whatsapp_status', whatsappService.getStatus());
  const qr = whatsappService.getQrCode();
  if (qr) { socket.emit('whatsapp_qr', qr); }
  socket.on('disconnect', () => { console.log('Usuário desconectou do socket:', socket.id); });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  whatsappService.initialize(io); // Inicia o motor do WhatsApp
});