import Notification from '../models/Notification.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findByUser(userId);
    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

export const getDoctorNotifications = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const notifications = await Notification.findByDoctor(doctorId);
    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.markAsRead(id);
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
};

export const markAllAsReadForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.markAllAsReadForUser(userId);
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
};

export const markAllAsReadForDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id;
    await Notification.markAllAsReadForDoctor(doctorId);
    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
};
