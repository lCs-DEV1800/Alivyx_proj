import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import { validateCPF, validateCRM, validateEmail } from '../utils/validation.js';

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const registerPatient = async (req, res) => {
  try {
    const { cpf, name, email, phone, password } = req.body;

    // Validações
    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se CPF já existe
    const existingCpf = await User.findByCpf(cpf);
    if (existingCpf) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Verificar se email já existe
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Criar usuário
    const userId = await User.create({
      cpf,
      name,
      email,
      phone,
      password_hash
    });

    // Criar notificação de boas-vindas
    await Notification.create({
      userId,
      doctorId: null,
      message: 'Bem-vindo ao CheckAgora! Agende seu primeiro exame.'
    });

    // Buscar usuário criado
    const user = await User.findById(userId);

    // Gerar token
    const token = generateToken({
      id: user.id,
      type: 'patient',
      cpf: user.cpf
    });

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Erro no registro de paciente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

export const loginPatient = async (req, res) => {
  try {
    const { cpf, password } = req.body;

    // Buscar usuário por CPF ou email
    let user = await User.findByCpf(cpf);
    if (!user && validateEmail(cpf)) {
      user = await User.findByEmail(cpf);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'CPF/Email ou senha incorretos' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'CPF/Email ou senha incorretos' });
    }

    // Gerar token
    const token = generateToken({
      id: user.id,
      type: 'patient',
      cpf: user.cpf
    });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Erro no login de paciente:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const registerDoctor = async (req, res) => {
  try {
    const { crm, name, email, phone, password, specialty, registrationCode, ubsId } = req.body;
    
    // Validar código de registro
    if (registrationCode !== 'ALIVIX') {
      return res.status(403).json({ error: 'Código de registro inválido' });
    }

    // Validações
    if (!validateCRM(crm)) {
      return res.status(400).json({ error: 'CRM inválido' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se CRM já existe
    const existingCrm = await Doctor.findByCrm(crm);
    if (existingCrm) {
      return res.status(400).json({ error: 'CRM já cadastrado' });
    }

    // Verificar se email já existe
    const existingEmail = await Doctor.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Criar médico
    const doctorId = await Doctor.create({
      crm,
      name,
      email,
      phone,
      password_hash,
      specialty
    });
    
    // Vincular à UBS se fornecido
    if (ubsId) {
      await Doctor.linkToUbs(doctorId, ubsId);
    }

    // Criar notificação de boas-vindas
    await Notification.create({
      userId: null,
      doctorId,
      message: 'Bem-vindo ao CheckAgora! Configure sua disponibilidade.'
    });

    // Buscar médico criado
    const doctor = await Doctor.findById(doctorId);

    // Gerar token
    const token = generateToken({
      id: doctor.id,
      type: 'doctor',
      crm: doctor.crm
    });

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      doctor: {
        id: doctor.id,
        crm: doctor.crm,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialty: doctor.specialty
      }
    });
  } catch (error) {
    console.error('Erro no registro de médico:', error);
    res.status(500).json({ error: 'Erro ao cadastrar médico' });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { crm, password } = req.body;

    // Buscar médico por CRM ou email
    let doctor = await Doctor.findByCrm(crm);
    if (!doctor && validateEmail(crm)) {
      doctor = await Doctor.findByEmail(crm);
    }
    
    if (!doctor) {
      return res.status(401).json({ error: 'CRM/Email ou senha incorretos' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, doctor.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'CRM/Email ou senha incorretos' });
    }

    // Gerar token
    const token = generateToken({
      id: doctor.id,
      type: 'doctor',
      crm: doctor.crm
    });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      doctor: {
        id: doctor.id,
        crm: doctor.crm,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialty: doctor.specialty
      }
    });
  } catch (error) {
    console.error('Erro no login de médico:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { id, type } = req.user;

    if (type === 'patient') {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ user });
    } else if (type === 'doctor') {
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ error: 'Médico não encontrado' });
      }
      res.json({ doctor });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

export const updatePatientProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, phone, password } = req.body;

    const updateData = { name, phone };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      }
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await User.update(id, updateData);
    const updatedUser = await User.findById(id);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, phone, password, specialty } = req.body;

    const updateData = { name, phone, specialty };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      }
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await Doctor.update(id, updateData);
    const updatedDoctor = await Doctor.findById(id);

    res.json({
      message: 'Perfil atualizado com sucesso',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};
