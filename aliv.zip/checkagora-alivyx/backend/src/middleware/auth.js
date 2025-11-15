import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = decoded;
    next();
  });
};

export const authenticatePatient = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.type !== 'patient') {
      return res.status(403).json({ error: 'Acesso negado. Apenas pacientes podem acessar esta rota.' });
    }
    next();
  });
};

export const authenticateDoctor = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.type !== 'doctor') {
      return res.status(403).json({ error: 'Acesso negado. Apenas médicos podem acessar esta rota.' });
    }
    next();
  });
};
