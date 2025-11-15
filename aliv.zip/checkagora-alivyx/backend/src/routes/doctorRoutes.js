import express from 'express';
import {
  getDoctorUBS,
  setAvailability,
  removeAvailability,
  getAvailability,
  getDoctorAppointments,
  getUpcomingDoctorAppointments,
  getTodayAppointments,
  getAppointmentsByDate,
  confirmAppointment,
  completeAppointment
} from '../controllers/doctorController.js';
import {
  setDateAvailability,
  removeDateAvailability,
  getAvailableDates
} from '../controllers/doctorDateAvailabilityController.js';
import { authenticateDoctor } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas exigem autenticação de médico
router.use(authenticateDoctor);

// Gerenciamento de UBS
router.get('/ubs', getDoctorUBS);

// Gerenciamento de disponibilidade
router.post('/availability', setAvailability);
router.delete('/availability', removeAvailability);
router.get('/availability/:ubsId', getAvailability);

// Gerenciamento de disponibilidade por data
router.post('/date-availability', setDateAvailability);
router.delete('/date-availability', removeDateAvailability);
router.get('/date-availability/:ubsId', getAvailableDates);

// Gerenciamento de agendamentos
router.get('/appointments', getDoctorAppointments);
router.get('/appointments/upcoming', getUpcomingDoctorAppointments);
router.get('/appointments/today', getTodayAppointments);
router.get('/appointments/date/:date', getAppointmentsByDate);
router.put('/appointments/:id/confirm', confirmAppointment);
router.put('/appointments/:id/complete', completeAppointment);

export default router;
