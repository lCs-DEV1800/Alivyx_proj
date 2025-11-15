import pool from '../config/database.js';

class Notification {
  static async create({ userId, doctorId, message }) {
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, doctor_id, message) VALUES (?, ?, ?)',
      [userId || null, doctorId || null, message]
    );
    return result.insertId;
  }

  static async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  static async findByDoctor(doctorId) {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE doctor_id = ? ORDER BY created_at DESC',
      [doctorId]
    );
    return rows;
  }

  static async markAsRead(id) {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsReadForUser(userId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsReadForDoctor(doctorId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE doctor_id = ? AND is_read = FALSE',
      [doctorId]
    );
    return result.affectedRows > 0;
  }

  static async getUnreadCountForUser(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  }

  static async getUnreadCountForDoctor(doctorId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE doctor_id = ? AND is_read = FALSE',
      [doctorId]
    );
    return rows[0].count;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default Notification;
