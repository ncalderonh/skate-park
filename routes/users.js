const express = require('express');
const jwt = require('jwt-simple');
const { Pool } = require('pg');
const { secretKey } = require('../config');
const pool = new Pool();
const router = express.Router();

// Middleware para proteger rutas
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, message: 'Token no proporcionado' });

    try {
        const decoded = jwt.decode(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

// Obtener perfil del usuario
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters WHERE id = $1', [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo el perfil del usuario' });
    }
});

// Actualizar perfil del usuario
router.put('/profile', requireAuth, async (req, res) => {
    const { nombre, password, anos_experiencia, especialidad } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const query = `UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4 WHERE id = $5 RETURNING *`;
        const values = [nombre, hashedPassword, anos_experiencia, especialidad, req.user.id];
        const result = await pool.query(query, values);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error actualizando el perfil del usuario' });
    }
});

// Eliminar cuenta del usuario
router.delete('/profile', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM skaters WHERE id = $1', [req.user.id]);
        res.json({ success: true, message: 'Cuenta eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error eliminando la cuenta' });
    }
});

module.exports = router;
