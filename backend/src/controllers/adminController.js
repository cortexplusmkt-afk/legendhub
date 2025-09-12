const db = require('../config/db');
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const whatsappService = require('../services/whatsappService');

// --- FUNÇÕES DE APOIO PARA IMPORTAÇÃO ---
const formatCpf = (cpf) => {
  if (!cpf) return null;
  const cleaned = String(cpf).replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const formatPhone = (phone) => {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '');
};
const parseBrazilianDate = (dateString) => {
    if (!dateString || !String(dateString).trim()) return null;
    if (dateString instanceof Date) return dateString;
    const datePart = String(dateString).split(' ')[0];
    const parts = datePart.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return null;
};
const stringToBoolean = (str) => {
    if (typeof str !== 'string' || !str.trim()) return null;
    return str.trim().toLowerCase() === 'sim';
};
const findValue = (row, keys) => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const foundKey = rowKeys.find(rowKey => rowKey.toLowerCase() === key.toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return row[foundKey];
      }
    }
    return null;
};

// --- FUNÇÕES DO CONTROLLER ---

exports.getEmergencyContacts = async (req, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'lady') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  try {
    const result = await db.query(
      `SELECT full_name, emergency_contact_name, emergency_contact_phone, emergency_contact_email 
       FROM participants 
       WHERE emergency_contact_name IS NOT NULL AND emergency_contact_name != ''
       ORDER BY full_name ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar contatos de emergência:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

exports.importParticipants = async (req, res) => {
  if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
  if (!req.file) { return res.status(400).json({ message: 'Nenhum arquivo enviado.' }); }
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const results = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    for (const row of results) {
      try {
        if (findValue(row, ['Status']) !== 'AUSENTE' && findValue(row, ['Status']) !== 'Ativo') {
          continue;
        }
        const participantData = {
          full_name: findValue(row, ['Nome', 'Nome Completo']),
          email: findValue(row, ['Email', 'E-mail']),
          cpf: formatCpf(findValue(row, ['Cpf', 'CPF'])),
          phone: formatPhone(findValue(row, ['Telefone', 'WhatsApp'])),
          registration_date: parseBrazilianDate(findValue(row, ['Data cadastro'])),
          birth_date: parseBrazilianDate(findValue(row, ['Nascimento', 'Data de Nascimento'])),
          address: `${findValue(row, ['Cidade']) || ''}, ${findValue(row, ['Estado']) || ''}`,
          profession: findValue(row, ['Profissão']),
          instagram: findValue(row, ['Instagram']),
          church: findValue(row, ['Igreja']),
          tshirt_size: findValue(row, ['Tamanho']),
          weight: findValue(row, ['Peso']) ? parseFloat(String(findValue(row, ['Peso'])).replace(',', '.')) : null,
          height: findValue(row, ['Altura']) ? parseInt(String(findValue(row, ['Altura']))) : null,
          physical_condition: findValue(row, ['Cond. físico']),
          has_medical_condition: stringToBoolean(findValue(row, ['Cond. médica?'])),
          medical_condition_details: findValue(row, ['Cond. detalhada']),
          uses_medication: stringToBoolean(findValue(row, ['Uso medicamento?'])),
          medication_details: findValue(row, ['Medicamento']),
          has_food_restriction: stringToBoolean(findValue(row, ['Restrição alim.'])),
          food_restriction_details: findValue(row, ['Detalhe alim.']),
          companion_name: findValue(row, ['Nome acompanhante']),
          emergency_contact_name: findValue(row, ['Nome Esposa']),
          emergency_contact_phone: formatPhone(findValue(row, ['WhatsApp Esposa'])),
          emergency_contact_email: findValue(row, ['E-mail Esposa']),
          profile_status: 'pending'
        };
        if (!participantData.full_name || !participantData.email || !participantData.cpf) {
          throw new Error('Dados essenciais (Nome, Email, CPF) faltando na linha.');
        }
        const columns = Object.keys(participantData).filter(key => participantData[key] !== null && participantData[key] !== undefined);
        const values = columns.map(key => participantData[key]);
        const valuePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO participants (${columns.join(', ')}) VALUES (${valuePlaceholders}) ON CONFLICT (cpf) DO UPDATE SET ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}, updated_at = NOW()`;
        await db.query(query, values);
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({ nome: findValue(row, ['Nome']) || 'Linha sem nome', erro: err.message });
      }
    }
    res.status(200).json({ message: 'Importação finalizada.', totalRows: results.length, processed: successCount + errorCount, imported: successCount, errors: errorCount, errorDetails: errors });
  } catch (err) {
    console.error("Erro ao ler o arquivo XLSX:", err);
    res.status(500).json({ message: "Erro ao processar o arquivo. Verifique se o formato está correto." });
  }
};

exports.getDashboardStats = async (req, res) => {
  if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
  try {
    const queries = [
      db.query('SELECT COUNT(*) FROM participants'),
      db.query("SELECT COUNT(*) FROM participants WHERE profile_status = 'pending'"),
      db.query("SELECT COUNT(*) FROM participants WHERE medical_document_status = 'submitted'"),
      db.query("SELECT COUNT(*) FROM participants WHERE profile_status = 'complete' AND medical_document_status = 'approved'"),
      db.query('SELECT COUNT(*) FROM checkins')
    ];
    const [total, pendingProfile, pendingMedical, fullyApproved, checkedIn] = await Promise.all(queries);
    res.status(200).json({
      totalParticipants: parseInt(total.rows[0].count, 10),
      pendingProfile: parseInt(pendingProfile.rows[0].count, 10),
      pendingMedical: parseInt(pendingMedical.rows[0].count, 10),
      fullyApproved: parseInt(fullyApproved.rows[0].count, 10),
      checkedIn: parseInt(checkedIn.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas do dashboard:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

exports.exportParticipantLinks = async (req, res) => {
    if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' });}
    const { status } = req.query;
    if (!status || (status !== 'pending' && status !== 'complete')) { return res.status(400).json({ message: "O status deve ser 'pending' ou 'complete'." });}
    try {
      const dbResult = await db.query("SELECT full_name, phone FROM participants WHERE profile_status = $1 AND phone IS NOT NULL AND phone != ''", [status]);
      const participants = dbResult.rows;
      if (participants.length === 0) { return res.status(404).json({ message: 'Nenhum participante encontrado para este status.' }); }
      let baseMessage = '';
      if (status === 'pending') {
          baseMessage = 'Olá, {nome}! Verificamos que seu cadastro para o Legendários está pendente. Por favor, acesse o portal para completar seus dados e garantir sua participação! Acesse: https://legendhub.cortexplus.com.br';
      } else {
          baseMessage = 'Olá, {nome}! Seu cadastro para o Legendários está completo e seu atestado médico foi recebido. Parabéns! Estamos ansiosos para te ver no evento.';
      }
      const dataForCsv = participants.map(p => {
        const cleanPhone = p.phone.replace(/\D/g, '');
        const personalizedMessage = baseMessage.replace('{nome}', p.full_name.split(' ')[0]);
        const encodedMessage = encodeURIComponent(personalizedMessage);
        const whatsappLink = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
        return { 'Nome': p.full_name, 'Telefone': p.phone, 'Link WhatsApp': whatsappLink };
      });
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(dataForCsv);
      res.header('Content-Type', 'text/csv');
      res.attachment(`contatos_legendhub_${status}.csv`);
      res.send(csv);
    } catch (err) {
      console.error(`Erro ao exportar links:`, err);
      res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.getAllUsers = async (req, res) => {
  if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
  try {
    const result = await db.query("SELECT id, name, email, role FROM users WHERE id != $1 ORDER BY name ASC", [req.userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

exports.createUser = async (req, res) => {
    if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role || (role !== 'medical' && role !== 'checkin' && role !== 'admin' && role !== 'lady')) {
        return res.status(400).json({ message: 'Dados inválidos ou função não permitida.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role', [name, email, hashedPassword, role]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { return res.status(409).json({ message: 'Este e-mail já está em uso.' }); }
        console.error('Erro ao criar usuário:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.deleteUser = async (req, res) => {
    if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
    const { userIdToDelete } = req.params;
    if (userIdToDelete === req.userId) { return res.status(400).json({ message: 'Você não pode deletar sua própria conta.' }); }
    try {
        await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
        res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar usuário:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.resetEventData = async (req, res) => {
  if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
  try {
    await db.query('TRUNCATE TABLE participants, medical_documents, checkins RESTART IDENTITY CASCADE');
    res.status(200).json({ message: 'Todos os dados de participantes, atestados e check-ins foram zerados com sucesso.' });
  } catch (err) {
    console.error('Erro ao zerar dados:', err);
    res.status(500).json({ message: 'Erro no servidor ao tentar zerar os dados.' });
  }
};

exports.autoAssignFamilies = async (req, res) => {
  if (req.userRole !== 'admin') { return res.status(403).json({ message: 'Acesso negado.' }); }
  const NUM_FAMILIES = 12;
  try {
    const { rows: participants } = await db.query('SELECT * FROM participants WHERE family_number IS NULL');
    if (participants.length === 0) { return res.status(200).json({ message: 'Nenhum participante para atribuir.' }); }
    const augmentedParticipants = participants.map(p => {
      const age = p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : 30;
      let imc = 25;
      if (p.height && p.weight && p.height > 0) {
        const heightInMeters = p.height / 100;
        imc = p.weight / (heightInMeters * heightInMeters);
      }
      const physicalConditionScore = p.physical_condition ? parseInt(p.physical_condition, 10) : 5;
      const performanceScore = (physicalConditionScore * 0.7) - (imc * 0.3);
      return { ...p, age, imc, performanceScore };
    });
    const veterans = augmentedParticipants.filter(p => p.age >= 60);
    const others = augmentedParticipants.filter(p => p.age < 60);
    let families = Array.from({ length: NUM_FAMILIES }, () => []);
    const middleFamilyIndices = [2, 3, 4, 5, 6, 7, 8];
    veterans.forEach((vet, index) => {
      const familyIndex = middleFamilyIndices[index % middleFamilyIndices.length];
      families[familyIndex].push(vet);
    });
    others.sort((a, b) => a.performanceScore - b.performanceScore);
    let direction = 1; let familyIndex = 0;
    others.forEach(participant => {
      families[familyIndex].push(participant);
      familyIndex += direction;
      if (familyIndex === NUM_FAMILIES || familyIndex === -1) {
        direction *= -1;
        familyIndex += direction;
      }
    });
    const updatePromises = [];
    for (let i = 0; i < families.length; i++) {
      const familyNum = i + 1;
      for (const participant of families[i]) {
        updatePromises.push(db.query('UPDATE participants SET family_number = $1 WHERE id = $2', [familyNum, participant.id]));
      }
    }
    await Promise.all(updatePromises);
    res.status(200).json({ message: `${participants.length} participantes distribuídos em ${NUM_FAMILIES} famílias.` });
  } catch (err) {
    console.error('Erro ao atribuir famílias:', err);
    res.status(500).json({ message: 'Erro no servidor ao processar o algoritmo.' });
  }
};

exports.sendBulkWhatsapp = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  const { status, message } = req.body;
  const io = req.io;
  if (!status || !message) {
    return res.status(400).json({ message: 'Status e mensagem são obrigatórios.' });
  }
  try {
    const { rows: participants } = await db.query(
      "SELECT id, full_name, phone FROM participants WHERE profile_status = $1 AND notified_pending = false AND phone IS NOT NULL AND phone != ''",
      [status]
    );
    if (participants.length === 0) {
      return res.status(404).json({ message: `Nenhum participante novo com status '${status}' para notificar.` });
    }
    const participantIds = participants.map(p => p.id);
    await db.query('UPDATE participants SET notified_pending = true WHERE id = ANY($1::uuid[])', [participantIds]);
    
    res.status(200).json({ 
        message: `Disparo iniciado para ${participants.length} novos participantes. Acompanhe o progresso no painel.` 
    });
    (async () => {
      let sentCount = 0;
      for (const participant of participants) {
        const personalizedMessage = message.replace(/{nome}/g, participant.full_name.split(' ')[0]);
        const success = await whatsappService.sendMessage(participant.phone, personalizedMessage);
        if (success) { sentCount++; }
        io.emit('whatsapp_progress', { sent: sentCount, total: participants.length, currentName: participant.full_name, success: success });
        const delay = Math.random() * 8000 + 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      console.log('Disparo em massa concluído.');
      io.emit('whatsapp_finished', { sent: sentCount, total: participants.length });
    })();
  } catch (err) {
    console.error('Erro ao iniciar disparo de WhatsApp:', err);
    res.status(500).json({ message: 'Erro no servidor ao processar o disparo.' });
  }
};