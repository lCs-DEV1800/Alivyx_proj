import pool from '../config/database.js';

class Appointment {
  static async create({ userId, doctorId, ubsId, appointmentType, specialty, appointmentDate, appointmentTime, queuePosition }) {
    const [result] = await pool.execute(
      `INSERT INTO appointments 
       (user_id, doctor_id, ubs_id, appointment_type, specialty, appointment_date, appointment_time, queue_position, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, doctorId, ubsId, appointmentType, specialty, appointmentDate, appointmentTime, queuePosition]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf, u.phone as patient_phone,
              d.name as doctor_name, d.crm, d.specialty as doctor_specialty,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf,
              d.name as doctor_name, d.specialty as doctor_specialty,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.user_id = ? AND a.status != 'cancelled'
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [userId]
    );
    return rows;
  }

  static async findByDoctor(doctorId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf, u.phone as patient_phone,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.doctor_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [doctorId]
    );
    return rows;
  }

  static async findByDate(userId, date) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              d.name as doctor_name, d.specialty as doctor_specialty,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.user_id = ? AND a.appointment_date = ?
       ORDER BY a.appointment_time`,
      [userId, date]
    );
    return rows;
  }

  static async findByDoctorAndDate(doctorId, date) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf, u.phone as patient_phone,
              ubs.name as ubs_name, ubs.district
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status != 'cancelled'
       ORDER BY a.appointment_time`,
      [doctorId, date]
    );
    return rows;
  }

  static async checkTimeSlotAvailability(doctorId, ubsId, date, time) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = ? 
       AND ubs_id = ?
       AND appointment_date = ?
       AND appointment_time = ?
       AND status != 'cancelled'`,
      [doctorId, ubsId, date, time]
    );
    return rows[0].count === 0;
  }

  static async getNextQueuePosition() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Lock and get current counter
      const [rows] = await connection.execute(
        'SELECT current_count FROM queue_counter WHERE id = 1 FOR UPDATE'
      );
      
      const newPosition = rows[0].current_count + 1;
      
      // Update counter
      await connection.execute(
        'UPDATE queue_counter SET current_count = ? WHERE id = 1',
        [newPosition]
      );
      
      await connection.commit();
      return newPosition;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async cancel(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Obter a posição do agendamento cancelado
      const [rows] = await connection.execute(
        'SELECT queue_position FROM appointments WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error('Agendamento não encontrado');
      }
      
      const cancelledPosition = rows[0].queue_position;
      
      // Cancelar o agendamento
      await connection.execute(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['cancelled', id]
      );
      
      // Reorganizar a fila: decrementar posição de todos os agendamentos posteriores
      await connection.execute(
        'UPDATE appointments SET queue_position = queue_position - 1 WHERE queue_position > ? AND status != "cancelled"',
        [cancelledPosition]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async confirm(id) {
    return await this.updateStatus(id, 'confirmed');
  }

  static async complete(id) {
    return await this.updateStatus(id, 'completed');
  }

  static async getUpcomingByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              d.name as doctor_name, d.specialty as doctor_specialty,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.user_id = ? 
       AND a.status != 'cancelled'
       AND (a.appointment_date > CURDATE() 
            OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME()))
       ORDER BY a.appointment_date, a.appointment_time`,
      [userId]
    );
    return rows;
  }

  static async getPastByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              d.name as doctor_name, d.specialty as doctor_specialty,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.user_id = ? 
       AND (a.appointment_date < CURDATE() 
            OR (a.appointment_date = CURDATE() AND a.appointment_time < CURTIME()))
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [userId]
    );
    return rows;
  }

  static async getUpcomingByDoctor(doctorId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf, u.phone as patient_phone,
              ubs.name as ubs_name, ubs.district, ubs.city
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.doctor_id = ? 
       AND a.status != 'cancelled'
       AND (a.appointment_date > CURDATE() 
            OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME()))
       ORDER BY a.appointment_date, a.appointment_time`,
      [doctorId]
    );
    return rows;
  }

  static async getTodayByDoctor(doctorId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
              u.name as patient_name, u.cpf, u.phone as patient_phone,
              ubs.name as ubs_name, ubs.district
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN ubs ON a.ubs_id = ubs.id
       WHERE a.doctor_id = ? 
       AND a.appointment_date = CURDATE()
       AND a.status != 'cancelled'
       ORDER BY a.appointment_time`,
      [doctorId]
    );
    return rows;
  }
}

export default Appointment;
