const db = require('../config/db');
const jwt = require('jsonwebtoken');

const jwtSecret = 'sua_senha_secreta_jwt_aqui';

// Função de Login do Participante
exports.participantLogin = async (req, res) => {
  const { cpf, email } = req.body;
  if (!cpf || !email) { return res.status(400).json({ message: 'CPF e E-mail são obrigatórios.' }); }
  const cleanCpf = cpf.replace(/\D/g, '');
  try {
    const result = await db.query("SELECT * FROM participants WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = $1", [cleanCpf]);
    const participant = result.rows[0];
    if (!participant || !participant.email || participant.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ message: 'CPF ou E-mail inválidos.' });
    }
    const token = jwt.sign({ id: participant.id }, jwtSecret, { expiresIn: '24h' });
    res.status(200).json({ message: 'Acesso autorizado!', token, participant });
  } catch (err) {
    console.error('Erro no login do participante:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// Função para buscar o perfil do participante logado
exports.getProfile = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM participants WHERE id = $1', [req.participantId]);
    const participant = result.rows[0];
    if (!participant) { return res.status(404).json({ message: 'Participante não encontrado.' }); }
    res.status(200).json(participant);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// Função para atualizar o perfil do participante logado
exports.updateProfile = async (req, res) => {
  const { 
    full_name, email, phone, birth_date, address, 
    emergency_contact_name, emergency_contact_phone, profession, church,
    instagram, tshirt_size, weight, height, physical_condition,
    has_medical_condition, medical_condition_details, uses_medication,
    medication_details, has_food_restriction, food_restriction_details, companion_name,
    emergency_contact_email
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE participants SET 
         full_name = $1, email = $2, phone = $3, birth_date = $4, address = $5,
         emergency_contact_name = $6, emergency_contact_phone = $7, profession = $8,
         church = $9, instagram = $10, tshirt_size = $11, weight = $12, height = $13,
         physical_condition = $14, has_medical_condition = $15, medical_condition_details = $16,
         uses_medication = $17, medication_details = $18, has_food_restriction = $19,
         food_restriction_details = $20, companion_name = $21, emergency_contact_email = $22,
         profile_status = 'complete', updated_at = NOW() 
       WHERE id = $23 RETURNING *`,
      [
        full_name, email, phone, birth_date, address, 
        emergency_contact_name, emergency_contact_phone, profession, church,
        instagram, tshirt_size, weight, height, physical_condition,
        has_medical_condition, medical_condition_details, uses_medication,
        medication_details, has_food_restriction, food_restriction_details, companion_name,
        emergency_contact_email,
        req.participantId
      ]
    );
    res.status(200).json({ message: 'Perfil atualizado com sucesso!', participant: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// Função para upload do atestado médico
exports.uploadMedicalDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }
  
  // O caminho do arquivo agora vem direto do multer, que já o salvou no disco
  const fileUrl = `/uploads/medical_documents/${req.file.filename}`;

  try {
    await db.query('BEGIN');
    await db.query('INSERT INTO medical_documents (participant_id, file_url) VALUES ($1, $2)', [req.participantId, fileUrl]);
    await db.query("UPDATE participants SET medical_document_status = 'submitted', updated_at = NOW() WHERE id = $1", [req.participantId]);
    await db.query('COMMIT');
    res.status(200).json({ message: 'Atestado enviado com sucesso!', document_url: fileUrl });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erro ao enviar atestado:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};
