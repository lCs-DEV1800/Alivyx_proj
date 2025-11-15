import DoctorDateAvailability from '../models/DoctorDateAvailability.js';
import Doctor from '../models/Doctor.js';
import { validateDate } from '../utils/validation.js';

export const setDateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId, availableDate } = req.body;

    if (!validateDate(availableDate)) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    // Verificar se a data não é passada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(availableDate);
    
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Não é possível definir disponibilidade para datas passadas' });
    }

    await DoctorDateAvailability.setDateAvailability(doctorId, ubsId, availableDate);
    
    res.json({ message: 'Disponibilidade de data configurada com sucesso' });
  } catch (error) {
    console.error('Erro ao configurar disponibilidade de data:', error);
    res.status(500).json({ error: 'Erro ao configurar disponibilidade de data' });
  }
};

export const removeDateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId, availableDate } = req.body;

    await DoctorDateAvailability.removeDateAvailability(doctorId, ubsId, availableDate);
    
    res.json({ message: 'Disponibilidade de data removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover disponibilidade de data:', error);
    res.status(500).json({ error: 'Erro ao remover disponibilidade de data' });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { ubsId } = req.params;

    const dates = await DoctorDateAvailability.getAvailableDates(doctorId, ubsId);
    res.json({ dates });
  } catch (error) {
    console.error('Erro ao buscar datas disponíveis:', error);
    res.status(500).json({ error: 'Erro ao buscar datas disponíveis' });
  }
};

export const getAvailableDatesByUbs = async (req, res) => {
  try {
    const { ubsId } = req.params;

    const dates = await DoctorDateAvailability.getAvailableDatesByUbs(ubsId);
    res.json({ dates });
  } catch (error) {
    console.error('Erro ao buscar datas disponíveis:', error);
    res.status(500).json({ error: 'Erro ao buscar datas disponíveis' });
  }
};
