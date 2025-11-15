import pool from '../config/database.js';

class DoctorDateAvailability {
  static async setDateAvailability(doctorId, ubsId, availableDate) {
    const [result] = await pool.execute(
      `INSERT INTO doctor_date_availability (doctor_id, ubs_id, available_date, is_available)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_available = TRUE`,
      [doctorId, ubsId, availableDate]
    );
    return result.affectedRows > 0;
  }

  static async removeDateAvailability(doctorId, ubsId, availableDate) {
    const [result] = await pool.execute(
      'DELETE FROM doctor_date_availability WHERE doctor_id = ? AND ubs_id = ? AND available_date = ?',
      [doctorId, ubsId, availableDate]
    );
    return result.affectedRows > 0;
  }

  static async getAvailableDates(doctorId, ubsId) {
    const [rows] = await pool.execute(
      `SELECT available_date
       FROM doctor_date_availability
       WHERE doctor_id = ? AND ubs_id = ? AND is_available = TRUE AND available_date >= CURDATE()
       ORDER BY available_date`,
      [doctorId, ubsId]
    );
    return rows;
  }

  static async isDateAvailable(doctorId, ubsId, date) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM doctor_date_availability
       WHERE doctor_id = ? AND ubs_id = ? AND available_date = ? AND is_available = TRUE`,
      [doctorId, ubsId, date]
    );
    return rows[0].count > 0;
  }

  static async getAvailableDatesByUbs(ubsId) {
    const [rows] = await pool.execute(
      `SELECT DISTINCT dda.available_date, d.id as doctor_id, d.name as doctor_name, d.specialty
       FROM doctor_date_availability dda
       JOIN doctors d ON dda.doctor_id = d.id
       WHERE dda.ubs_id = ? AND dda.is_available = TRUE AND dda.available_date >= CURDATE()
       ORDER BY dda.available_date`,
      [ubsId]
    );
    return rows;
  }
}

export default DoctorDateAvailability;
