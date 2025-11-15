import pool from '../config/database.js';

class UBS {
  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM ubs ORDER BY district, name'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM ubs WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByDistrict(district) {
    const [rows] = await pool.execute(
      'SELECT * FROM ubs WHERE district = ? ORDER BY name',
      [district]
    );
    return rows;
  }

  static async findByCity(city) {
    const [rows] = await pool.execute(
      'SELECT * FROM ubs WHERE city = ? ORDER BY district, name',
      [city]
    );
    return rows;
  }

  static async getDistricts() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT district FROM ubs ORDER BY district'
    );
    return rows.map(row => row.district);
  }

  static async getDoctorForUbs(ubsId, specialty) {
    const [rows] = await pool.execute(
      `SELECT d.id, d.crm, d.name, d.email, d.phone, d.specialty
       FROM doctors d
       JOIN doctor_ubs du ON d.id = du.doctor_id
       WHERE du.ubs_id = ? AND d.specialty = ? AND du.is_active = TRUE
       LIMIT 1`,
      [ubsId, specialty]
    );
    return rows[0];
  }
}

export default UBS;
