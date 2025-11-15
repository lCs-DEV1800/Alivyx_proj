import pool from '../config/database.js';

class Doctor {
  static async create({ crm, name, email, phone, password_hash, specialty }) {
    const [result] = await pool.execute(
      'INSERT INTO doctors (crm, name, email, phone, password_hash, specialty) VALUES (?, ?, ?, ?, ?, ?)',
      [crm, name, email, phone, password_hash, specialty]
    );
    return result.insertId;
  }

  static async findByCrm(crm) {
    const [rows] = await pool.execute(
      'SELECT * FROM doctors WHERE crm = ?',
      [crm]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM doctors WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, crm, name, email, phone, specialty, created_at FROM doctors WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUbs(ubsId) {
    const [rows] = await pool.execute(
      `SELECT d.id, d.crm, d.name, d.email, d.phone, d.specialty 
       FROM doctors d
       JOIN doctor_ubs du ON d.id = du.doctor_id
       WHERE du.ubs_id = ? AND du.is_active = TRUE`,
      [ubsId]
    );
    return rows;
  }

  static async findBySpecialtyAndUbs(specialty, ubsId) {
    const [rows] = await pool.execute(
      `SELECT d.id, d.crm, d.name, d.email, d.phone, d.specialty 
       FROM doctors d
       JOIN doctor_ubs du ON d.id = du.doctor_id
       WHERE d.specialty = ? AND du.ubs_id = ? AND du.is_active = TRUE`,
      [specialty, ubsId]
    );
    return rows[0];
  }

  static async getUbsForDoctor(doctorId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.district, u.city, u.state, u.latitude, u.longitude
       FROM ubs u
       JOIN doctor_ubs du ON u.id = du.ubs_id
       WHERE du.doctor_id = ? AND du.is_active = TRUE`,
      [doctorId]
    );
    return rows;
  }

  static async linkToUbs(doctorId, ubsId) {
    const [result] = await pool.execute(
      'INSERT INTO doctor_ubs (doctor_id, ubs_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE is_active = TRUE',
      [doctorId, ubsId]
    );
    return result.affectedRows > 0;
  }

  static async unlinkFromUbs(doctorId, ubsId) {
    const [result] = await pool.execute(
      'UPDATE doctor_ubs SET is_active = FALSE WHERE doctor_id = ? AND ubs_id = ?',
      [doctorId, ubsId]
    );
    return result.affectedRows > 0;
  }

  static async update(id, { name, phone, password_hash, specialty }) {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (password_hash !== undefined) {
      updates.push('password_hash = ?');
      values.push(password_hash);
    }
    if (specialty !== undefined) {
      updates.push('specialty = ?');
      values.push(specialty);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE doctors SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Availability management
  static async setAvailability(doctorId, ubsId, dayOfWeek, startTime, endTime) {
    const [result] = await pool.execute(
      `INSERT INTO doctor_availability (doctor_id, ubs_id, day_of_week, start_time, end_time)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE start_time = ?, end_time = ?, is_active = TRUE`,
      [doctorId, ubsId, dayOfWeek, startTime, endTime, startTime, endTime]
    );
    return result.affectedRows > 0;
  }

  static async removeAvailability(doctorId, ubsId, dayOfWeek) {
    const [result] = await pool.execute(
      'UPDATE doctor_availability SET is_active = FALSE WHERE doctor_id = ? AND ubs_id = ? AND day_of_week = ?',
      [doctorId, ubsId, dayOfWeek]
    );
    return result.affectedRows > 0;
  }

  static async getAvailability(doctorId, ubsId) {
    const [rows] = await pool.execute(
      `SELECT id, day_of_week, start_time, end_time, is_active
       FROM doctor_availability
       WHERE doctor_id = ? AND ubs_id = ? AND is_active = TRUE
       ORDER BY day_of_week`,
      [doctorId, ubsId]
    );
    return rows;
  }

  static async isAvailable(doctorId, ubsId, date, time) {
    const dayOfWeek = new Date(date).getDay();
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM doctor_availability
       WHERE doctor_id = ? 
       AND ubs_id = ?
       AND day_of_week = ?
       AND start_time <= ?
       AND end_time >= ?
       AND is_active = TRUE`,
      [doctorId, ubsId, dayOfWeek, time, time]
    );
    return rows[0].count > 0;
  }
}

export default Doctor;
