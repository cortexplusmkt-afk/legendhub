const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido ou mal formatado.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error('Erro na verificação do JWT:', err);
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    
    // As linhas mais importantes, agora 100% corretas
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    return next();
  });
};
