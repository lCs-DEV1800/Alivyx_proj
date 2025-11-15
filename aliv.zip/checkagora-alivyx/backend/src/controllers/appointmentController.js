import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import DoctorDateAvailability from '../models/DoctorDateAvailability.js';
import UBS from '../models/UBS.js';
import Notification from '../models/Notification.js';
import { validateDate, validateTime } from '../utils/validation.js';
import { isFutureDateTime } from '../utils/helpers.js';

export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ubsId, specialty, appointmentDate, appointmentTime, appointmentType } = req.body;

    // Validações
    if (!validateDate(appointmentDate)) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    if (!validateTime(appointmentTime)) {
      return res.status(400).json({ error: 'Horário inválido' });
    }

    if (!isFutureDateTime(appointmentDate, appointmentTime)) {
      return res.status(400).json({ error: 'Não é possível agendar para datas/horários passados' });
    }

    // Buscar médico vinculado à UBS
    const doctors = await Doctor.findByUbs(ubsId);
    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ error: 'Nenhum médico disponível nesta UBS' });
    }
    const doctor = doctors[0]; // Pegar o primeiro médico da UBS

    // Verificar se o médico definiu disponibilidade para esta data específica (opcional)
    // Se não houver sistema de datas específicas configurado, permite agendamento
    const hasDateSystem = await DoctorDateAvailability.getAvailableDates(doctor.id, ubsId);
    if (hasDateSystem && hasDateSystem.length > 0) {
      const isDateAvailable = await DoctorDateAvailability.isDateAvailable(doctor.id, ubsId, appointmentDate);
      if (!isDateAvailable) {
        return res.status(400).json({ error: 'Médico não disponível nesta data' });
      }
    }

    // Verificar disponibilidade do médico no dia da semana e horário
    const isAvailable = await Doctor.isAvailable(doctor.id, ubsId, appointmentDate, appointmentTime);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Médico não disponível neste horário' });
    }

    // Verificar se o horário já está ocupado
    const isTimeSlotAvailable = await Appointment.checkTimeSlotAvailability(
      doctor.id,
      ubsId,
      appointmentDate,
      appointmentTime
    );

    if (!isTimeSlotAvailable) {
      return res.status(400).json({ error: 'Este horário já está reservado' });
    }

    // Obter próxima posição na fila
    const queuePosition = await Appointment.getNextQueuePosition();

    // Criar agendamento
    const appointmentId = await Appointment.create({
      userId,
      doctorId: doctor.id,
      ubsId,
      appointmentType: appointmentType || 'exam',
      specialty,
      appointmentDate,
      appointmentTime,
      queuePosition
    });

    // Buscar UBS
    const ubs = await UBS.findById(ubsId);

    // Criar notificações
    await Notification.create({
      userId,
      doctorId: null,
      message: `Agendamento para ${specialty} confirmado! Posição na fila: ${queuePosition}`
    });

    await Notification.create({
      userId: null,
      doctorId: doctor.id,
      message: `Novo agendamento: ${specialty} em ${new Date(appointmentDate).toLocaleDateString('pt-BR')} às ${appointmentTime}`
    });

    const appointment = await Appointment.findById(appointmentId);

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      appointment,
      queuePosition
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
};

export const getAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.findByUser(userId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getAppointmentsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    const appointments = await Appointment.findByDate(userId, date);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.getUpcomingByUser(userId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const getPastAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.getPastByUser(userId);
    res.json({ appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (appointment.user_id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Este agendamento já foi cancelado' });
    }

    await Appointment.cancel(id);

    // Notificar médico
    await Notification.create({
      userId: null,
      doctorId: appointment.doctor_id,
      message: `Agendamento cancelado: ${appointment.specialty} em ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')} às ${appointment.appointment_time}`
    });

    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
};

export const getUBSList = async (req, res) => {
  try {
    const ubsList = await UBS.findAll();
    res.json({ ubs: ubsList });
  } catch (error) {
    console.error('Erro ao buscar UBS:', error);
    res.status(500).json({ error: 'Erro ao buscar UBS' });
  }
};

export const getUBSByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const ubsList = await UBS.findByDistrict(district);
    res.json({ ubs: ubsList });
  } catch (error) {
    console.error('Erro ao buscar UBS:', error);
    res.status(500).json({ error: 'Erro ao buscar UBS' });
  }
};

export const getDoctorsByUbs = async (req, res) => {
  try {
    const { ubsId } = req.params;
    const doctors = await Doctor.findByUbs(ubsId);
    res.json({ doctors });
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    res.status(500).json({ error: 'Erro ao buscar médicos' });
  }
};

export const getDistricts = async (req, res) => {
  try {
    const districts = await UBS.getDistricts();
    res.json({ districts });
  } catch (error) {
    console.error('Erro ao buscar bairros:', error);
    res.status(500).json({ error: 'Erro ao buscar bairros' });
  }
};
