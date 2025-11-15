import express from 'express';
import {
  createAppointment,
  getAppointmentsByUser,
  getAppointmentsByDate,
  getUpcomingAppointments,
  getPastAppointments,
  cancelAppointment,
  getUBSList,
  getUBSByDistrict,
  getDoctorsByUbs,
  getDistricts
} from '../controllers/appointmentController.js';
import { getAvailableDatesByUbs } from '../controllers/doctorDateAvailabilityController.js';
import { authenticatePatient } from '../middleware/auth.js';

const router = express.Router();

// Rotas de agendamentos (apenas pacientes)
router.post('/', authenticatePatient, createAppointment);
router.get('/', authenticatePatient, getAppointmentsByUser);
router.get('/upcoming', authenticatePatient, getUpcomingAppointments);
router.get('/past', authenticatePatient, getPastAppointments);
router.get('/date/:date', authenticatePatient, getAppointmentsByDate);
router.delete('/:id', authenticatePatient, cancelAppointment);

// Rotas de UBS (públicas para pacientes autenticados)
router.get('/ubs', authenticatePatient, getUBSList);
router.get('/ubs/district/:district', authenticatePatient, getUBSByDistrict);
router.get('/ubs/:ubsId/doctors', authenticatePatient, getDoctorsByUbs);
router.get('/ubs/:ubsId/available-dates', authenticatePatient, getAvailableDatesByUbs);
router.get('/districts', authenticatePatient, getDistricts);

export default router;
