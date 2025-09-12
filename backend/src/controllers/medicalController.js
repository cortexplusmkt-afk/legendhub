const db = require('../config/db');

// Função para listar todos os participantes com atestados pendentes de análise
exports.getPendingSubmissions = async (req, res) => {
  // Apenas usuários médicos ou admins podem ver a lista
  if (req.userRole !== 'medical' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const result = await db.query(
      `SELECT p.id, p.full_name, p.cpf, md.file_url, md.uploaded_at
       FROM participants p
       JOIN medical_documents md ON p.id = md.participant_id
       WHERE p.medical_document_status = 'submitted'
       ORDER BY md.uploaded_at ASC`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar atestados pendentes:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// Função para aprovar ou reprovar um atestado
exports.validateDocument = async (req, res) => {
  if (req.userRole !== 'medical' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const { participantId } = req.params;
  const { status } = req.body; // status deve ser 'approved' ou 'rejected'
  const validatorUserId = req.userId; // ID do médico logado, vindo do token

  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ message: "O status deve ser 'approved' ou 'rejected'." });
  }

  try {
    const result = await db.query(
      `UPDATE participants
       SET medical_document_status = $1, medical_document_validated_by = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, full_name, medical_document_status`,
      [status, validatorUserId, participantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Participante não encontrado.' });
    }

    res.status(200).json({ 
        message: `Atestado do participante foi ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`,
        participant: result.rows[0] 
    });
  } catch (err) {
    console.error('Erro ao validar atestado:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};
// NOVO: Aprova um participante manualmente, sem atestado
exports.manualApprove = async (req, res) => {
  if (req.userRole !== 'medical' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  const { participantId } = req.params;
  const validatorUserId = req.userId;
  try {
    await db.query(
      "UPDATE participants SET medical_document_status = 'approved', medical_document_validated_by = $1, updated_at = NOW() WHERE id = $2",
      [validatorUserId, participantId]
    );
    res.status(200).json({ message: 'Participante aprovado manualmente com sucesso.' });
  } catch (err) {
    console.error('Erro na aprovação manual:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
};