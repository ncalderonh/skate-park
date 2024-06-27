const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const { Pool } = require('pg');
const { secretKey } = require('../config');
const pool = new Pool();
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    const { email, nombre, password, anos_experiencia, especialidad } = req.body;
    const foto = req.files.foto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const fotoPath = `/uploads/${Date.now()}_${foto.name}`;
    foto.mv(`./public${fotoPath}`);

    const query = `INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [email, nombre, hashedPassword, anos_experiencia, especialidad, fotoPath, false];

    try {
        const result = await pool.query(query, values);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registrando el usuario' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Email o contraseña incorrecta' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ success: false, message: 'Email o contraseña incorrecta' });

        const token = jwt.encode({ id: user.id, email: user.email }, secretKey);
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error iniciando sesión' });
    }
});

module.exports = router;
