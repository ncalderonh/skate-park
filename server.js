const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar Handlebars
app.engine('hbs', exphbs.engine({ extname: 'hbs' }));
app.set('view engine', 'hbs');

// Configurar middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('public'));

// Conexión a la base de datos PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token requerido');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('Token inválido');
        req.userId = decoded.id;
        next();
    });
};

// Ruta de inicio
app.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM skaters');
    res.render('index', { skaters: result.rows });
});

// Ruta para el registro de usuarios
app.get('/registro', (req, res) => {
    res.render('registro');
});

app.post('/registro', async (req, res) => {
    const { email, nombre, password, anos_experiencia, especialidad } = req.body;
    const foto = req.files.foto;

    const hashedPassword = await bcrypt.hash(password, 10);
    const fotoPath = `public/uploads/${foto.name}`;
    foto.mv(fotoPath);

    await pool.query('INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto) VALUES ($1, $2, $3, $4, $5, $6)', [email, nombre, hashedPassword, anos_experiencia, especialidad, fotoPath]);

    res.redirect('/');
});

// Ruta para el inicio de sesión
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);

    if (result.rows.length === 0) return res.status(400).send('Usuario no encontrado');

    const skater = result.rows[0];
    const validPassword = await bcrypt.compare(password, skater.password);

    if (!validPassword) return res.status(400).send('Contraseña incorrecta');

    const token = jwt.sign({ id: skater.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ token });
});

// Ruta para mostrar los datos del perfil
app.get('/datos', verifyToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM skaters WHERE id = $1', [req.userId]);
    const skater = result.rows[0];

    res.render('datos', { skater });
});

// Ruta para la administración
app.get('/admin', verifyToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM skaters');
    res.render('admin', { skaters: result.rows });
});

// Escuchar en el puerto configurado
app.listen(port, () => {
    console.log(`Servidor rodando en el puerto ${port}`);
});
