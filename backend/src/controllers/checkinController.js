const db = require('../config/db');

// A MUDANÇA ESTÁ AQUI NESTA PRIMEIRA FUNÇÃO
exports.getAllParticipants = async (req, res) => {
  if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    // MUDANÇA: Trocamos a lista de colunas por 'p.*', que significa "todas as colunas da tabela p (participants)"
    const result = await db.query(
      `SELECT p.*,
              CASE WHEN c.id IS NOT NULL THEN true ELSE false END AS has_checked_in
       FROM participants p
       LEFT JOIN checkins c ON p.id = c.participant_id
       ORDER BY p.full_name ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar todos os participantes:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// O resto do arquivo continua o mesmo, mas aqui está ele completo para não haver erro.
exports.getFamilyCounts = async (req, res) => {
  if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  try {
    const result = await db.query(
      `SELECT family_number, COUNT(*) as member_count 
       FROM participants 
       WHERE family_number IS NOT NULL 
       GROUP BY family_number 
       ORDER BY family_number ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar contagem de famílias:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

exports.updateFamilyNumber = async (req, res) => {
    if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    const { participantId } = req.params;
    const { familyNumber } = req.body;
    if (!familyNumber || isNaN(parseInt(familyNumber))) {
        return res.status(400).json({ message: 'Número da família inválido.' });
    }
    try {
        await db.query('UPDATE participants SET family_number = $1 WHERE id = $2', [familyNumber, participantId]);
        res.status(200).json({ message: 'Família atualizada com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar família:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.updateParticipantByStaff = async (req, res) => {
    if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    const { participantId } = req.params;
    const formData = req.body;
    
    formData.has_medical_condition = formData.has_medical_condition === 'true' || formData.has_medical_condition === true;
    formData.uses_medication = formData.uses_medication === 'true' || formData.uses_medication === true;
    formData.has_food_restriction = formData.has_food_restriction === 'true' || formData.has_food_restriction === true;
    formData.profile_status = 'complete';

    const fields = Object.keys(formData).filter(key => key !== 'id' && key !== 'has_checked_in' && key !== 'created_at' && key !== 'updated_at');
    const values = fields.map(key => formData[key]);
    const setClauses = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const query = `UPDATE participants SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1}`;
    
    try {
        await db.query(query, [...values, participantId]);
        res.status(200).json({ message: 'Dados do participante atualizados com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar participante:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.searchParticipant = async (req, res) => {
  // Esta função agora é menos usada, mas mantemos para consistência
  if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  const { query } = req.query;
  if (!query) { return res.status(400).json({ message: 'Termo de busca é obrigatório.' }); }
  try {
    const result = await db.query(
      `SELECT * FROM participants
       WHERE cpf = $1 OR full_name ILIKE $2`,
      [query, `%${query}%`]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro na busca de participante:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

exports.performCheckin = async (req, res) => {
  if (req.userRole !== 'checkin' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  const { participantId } = req.params;
  const checkinUserId = req.userId;
  try {
    const participantResult = await db.query('SELECT * FROM participants WHERE id = $1', [participantId]);
    const participant = participantResult.rows[0];
    if (!participant) { return res.status(404).json({ message: 'Participante não encontrado.' }); }
    if (participant.profile_status !== 'complete') { return res.status(400).json({ message: 'Check-in bloqueado: Cadastro incompleto.' }); }
    if (participant.medical_document_status !== 'approved') { return res.status(400).json({ message: 'Check-in bloqueado: Atestado pendente.' }); }
    await db.query('INSERT INTO checkins (participant_id, checked_in_by_user_id) VALUES ($1, $2)', [participantId, checkinUserId]);
    res.status(200).json({ message: 'Check-in realizado com sucesso!', participant_name: participant.full_name });
  } catch (err) {
    if (err.code === '23505') { return res.status(409).json({ message: 'Este participante já fez check-in!' }); }
    console.error('Erro ao realizar check-in:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};