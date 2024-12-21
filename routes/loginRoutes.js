const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.error('Error: Missing username or password');
        return res.status(400).send('Missing username or password');
    }

    const query = 'SELECT id, role, password FROM login WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) {
            console.error('Database Query Error:', err);
            return res.status(500).send('Database server error');
        }
        if (result.length === 0) {
            console.error('Error: Invalid credentials, no matching username');
            return res.status(401).send('Invalid credentials');
        }

        const user = result[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            console.error('Error: Invalid credentials, password mismatch');
            return res.status(401).send('Invalid credentials');
        }

        try {
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.json({ token, role: user.role, id: user.id });
        } catch (jwtError) {
            console.error('JWT Generation Error:', jwtError);
            return res.status(500).send('Token generation error');
        }
    });
});


module.exports = router;
