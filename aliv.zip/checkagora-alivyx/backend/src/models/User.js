import pool from '../config/database.js';

class User {
  static async create({ cpf, name, email, phone, password_hash }) {
    const [result] = await pool.execute(
      'INSERT INTO users (cpf, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
      [cpf, name, email, phone, password_hash]
    );
    return result.insertId;
  }

  static async findByCpf(cpf) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE cpf = ?',
      [cpf]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, cpf, name, email, phone, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, { name, phone, password_hash }) {
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

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default User;
