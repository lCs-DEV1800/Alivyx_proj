import pool from '../config/database.js';

export const toggleDateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date } = req.body;

    const [doctor] = await pool.execute(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    );

    if (!doctor[0]) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const [ubsLink] = await pool.execute(
      'SELECT ubs_id FROM doctor_ubs WHERE doctor_id = ? AND is_active = TRUE LIMIT 1',
      [doctorId]
    );

    if (!ubsLink[0]) {
      return res.status(404).json({ error: 'UBS não vinculada' });
    }

    const ubsId = ubsLink[0].ubs_id;

    const [existing] = await pool.execute(
      'SELECT * FROM doctor_date_availability WHERE doctor_id = ? AND ubs_id = ? AND available_date = ?',
      [doctorId, ubsId, date]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE doctor_date_availability SET is_available = NOT is_available WHERE id = ?',
        [existing[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO doctor_date_availability (doctor_id, ubs_id, available_date, is_available) VALUES (?, ?, ?, TRUE)',
        [doctorId, ubsId, date]
      );
    }

    const [updated] = await pool.execute(
      'SELECT * FROM doctor_date_availability WHERE doctor_id = ? AND ubs_id = ? AND available_date = ?',
      [doctorId, ubsId, date]
    );

    res.json({ availability: updated[0] });
  } catch (error) {
    console.error('Erro ao alternar disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao alternar disponibilidade' });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [dates] = await pool.execute(
      'SELECT available_date, is_available FROM doctor_date_availability WHERE doctor_id = ? AND is_available = TRUE ORDER BY available_date',
      [doctorId]
    );

    res.json({ dates });
  } catch (error) {
    console.error('Erro ao buscar datas:', error);
    res.status(500).json({ error: 'Erro ao buscar datas' });
  }
};
