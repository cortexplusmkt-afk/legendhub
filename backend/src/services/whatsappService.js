const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let currentQr = null;
let status = 'Desconectado';

const initialize = (io) => {
    console.log('Iniciando serviço do WhatsApp...');

    client.on('qr', (qr) => {
        console.log('QR Code recebido, enviando para o frontend...');
        status = 'Aguardando QR Code';
        currentQr = qr;
        io.emit('whatsapp_qr', qr);
        io.emit('whatsapp_status', status);
    });

    client.on('ready', () => {
        console.log('Cliente do WhatsApp está pronto!');
        status = 'Conectado';
        currentQr = null;
        io.emit('whatsapp_ready');
        io.emit('whatsapp_status', status);
    });

    client.on('disconnected', (reason) => {
        console.log('Cliente do WhatsApp foi desconectado.', reason);
        status = 'Desconectado';
        io.emit('whatsapp_disconnected');
        io.emit('whatsapp_status', status);
        client.initialize();
    });

    client.initialize();
};

// --- A NOVA LÓGICA DE TESTE ---
const normalizeBrazilianNumber = (phone) => {
    let cleaned = String(phone).replace(/\D/g, '');

    // Remove o DDI 55, se houver
    if (cleaned.length > 11 && cleaned.startsWith('55')) {
        cleaned = cleaned.substring(2);
    }

    // Se o número tiver 11 dígitos (DDD + 9 + Número) e o terceiro dígito for 9, remove o 9
    if (cleaned.length === 11 && cleaned.substring(2, 3) === '9') {
        const ddd = cleaned.substring(0, 2);
        const numberPart = cleaned.substring(3); // Pula o 9º dígito
        return `${ddd}${numberPart}`; // Retorna o número com 10 dígitos
    }
    
    // Para todos os outros casos (já com 10 dígitos ou outros formatos), retorna como está
    return cleaned;
};

const sendMessage = async (to, message) => {
    if (status !== 'Conectado') {
        throw new Error('Cliente do WhatsApp não está conectado.');
    }
    
    const normalizedPhone = normalizeBrazilianNumber(to);
    
    // O número final agora deve ter 10 dígitos (DDD + 8 dígitos)
    const chatId = `55${normalizedPhone}@c.us`;

    try {
        await client.sendMessage(chatId, message);
        console.log(`Mensagem enviada com sucesso para ${chatId}`);
        return true;
    } catch (error) {
        console.error(`Falha ao enviar para ${chatId}. Erro:`, error.message ? error.message.split('\n')[0] : error);
        return false;
    }
};

const getStatus = () => status;
const getQrCode = () => currentQr;

module.exports = {
    initialize,
    sendMessage,
    getStatus,
    getQrCode,
};