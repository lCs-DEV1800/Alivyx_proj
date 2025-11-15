import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import { validateTime } from '../utils/validation.js';

export const getDoctorUBS = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const ubsList = await Doctor.getUbsForDoctor(doctorId);
    res.json({ ubs: ubsList });
  } catch (error) {
    console.error('Erro ao buscar UBS do médico:', error);
    res.status(500).json({ error: 'Erro ao buscar UBS' });
  }
};

export const setAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId, dayOfWeek, startTime, endTime } = req.body;

    if (!validateTime(startTime) || !validateTime(endTime)) {
      return res.status(400).json({ error: 'Horários inválidos' });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Dia da semana inválido (0-6)' });
    }

    await Doctor.setAvailability(doctorId, ubsId, dayOfWeek, startTime, endTime);
    
    res.json({ message: 'Disponibilidade configurada com sucesso' });
  } catch (error) {
    console.error('Erro ao configurar disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao configurar disponibilidade' });
  }
};

export const removeAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId, dayOfWeek } = req.body;

    await Doctor.removeAvailability(doctorId, ubsId, dayOfWeek);
    
    res.json({ message: 'Disponibilidade removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao remover disponibilidade' });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId } = req.params;

    const availability = await Doctor.getAvailability(doctorId, ubsId);
    res.json({ availability });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.findByDoctor(doctorId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getUpcomingDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.getUpcomingByDoctor(doctorId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getTodayAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.getTodayByDoctor(doctorId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getAppointmentsByDate = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date } = req.params;
    
    const appointments = await Appointment.findByDoctorAndDate(doctorId, date);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ error: 'Você não tem permissão para confirmar este agendamento' });
    }

    await Appointment.confirm(id);

    // Notificar paciente
    await Notification.create({
      userId: appointment.user_id,
      doctorId: null,
      message: `Seu agendamento para ${appointment.specialty} foi confirmado pelo médico!`
    });

    res.json({ message: 'Agendamento confirmado com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar agendamento' });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({ error: 'Você não tem permissão para finalizar este agendamento' });
    }

    await Appointment.complete(id);

    res.json({ message: 'Agendamento finalizado com sucesso' });
  } catch (error) {
    console.error('Erro ao finalizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao finalizar agendamento' });
  }
};
