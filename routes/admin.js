const express = require('express');
const { Pool } = require('pg');
const pool = new Pool();
const router = express.Router();

// Obtener lista de participantes
router.get('/participants', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.json({ success: true, participants: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo la lista de participantes' });
    }
});

// Aprobar participante
router.put('/approve/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('UPDATE skaters SET estado = TRUE WHERE id = $1 RETURNING *', [id]);
        res.json({ success: true, participant: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error aprobando al participante' });
    }
});

module.exports = router;
