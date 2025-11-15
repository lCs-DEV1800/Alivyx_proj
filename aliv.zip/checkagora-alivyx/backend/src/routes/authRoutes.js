import express from 'express';
import {
  registerPatient,
  loginPatient,
  registerDoctor,
  loginDoctor,
  getProfile,
  updatePatientProfile,
  updateDoctorProfile
} from '../controllers/authController.js';
import { authenticateToken, authenticatePatient, authenticateDoctor } from '../middleware/auth.js';

const router = express.Router();

// Rotas de pacientes
router.post('/patient/register', registerPatient);
router.post('/patient/login', loginPatient);
router.put('/patient/profile', authenticatePatient, updatePatientProfile);

// Rotas de médicos
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login', loginDoctor);
router.put('/doctor/profile', authenticateDoctor, updateDoctorProfile);

// Rota comum
router.get('/profile', authenticateToken, getProfile);

export default router;
