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

    // Query to get user by username
    const query = 'SELECT id, role, password FROM login WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) return res.status(500).send('Server error');
        if (result.length === 0) return res.status(401).send('Invalid credentials');

        const user = result[0];
        // Check if the provided password matches the hashed password in the database
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid credentials');

        // Generate a JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role, id: user.id });
    });
});

module.exports = router;
