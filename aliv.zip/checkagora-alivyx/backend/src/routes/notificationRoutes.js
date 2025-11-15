import express from 'express';
import {
  getUserNotifications,
  getDoctorNotifications,
  markAsRead,
  markAllAsReadForUser,
  markAllAsReadForDoctor
} from '../controllers/notificationController.js';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth.js';

const router = express.Router();

// Rotas de pacientes
router.get('/patient', authenticatePatient, getUserNotifications);
router.put('/patient/read-all', authenticatePatient, markAllAsReadForUser);

// Rotas de médicos
router.get('/doctor', authenticateDoctor, getDoctorNotifications);
router.put('/doctor/read-all', authenticateDoctor, markAllAsReadForDoctor);

// Rota comum
router.put('/:id/read', markAsRead);

export default router;
