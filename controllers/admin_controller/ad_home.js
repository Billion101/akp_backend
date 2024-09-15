const db = require('../../config/db');
const bcrypt = require('bcrypt');


// Add a day
const addAdminDay = (req, res) => {
    const { date } = req.body;
    const sql = 'INSERT INTO admin_days (date) VALUES (?)';
    db.query(sql, [date], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ dayId: result.insertId });
    });
};

// Get all days
const getAdminDay = (req, res) => {
    const sql = 'SELECT * FROM admin_days';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Delete a day
const deleteAdminDay = (req, res) => {
    const { id } = req.params;
    const deleteDays = 'DELETE FROM admin_days WHERE id = ?';
    const deleteUserEntries = 'DELETE FROM admin_entries WHERE day_id = ?';
    const deleteUserCodes = 'DELETE FROM admin_codes WHERE entry_id IN (SELECT id FROM admin_entries WHERE day_id = ?)';

    db.query(deleteUserCodes, [id], (err) => {
        if (err) throw err;
        db.query(deleteUserEntries, [id], (err) => {
            if (err) throw err;
            db.query(deleteDays, [id], (err) => {
                if (err) throw err;
                res.sendStatus(200);
            });
        });
    });
};

const verifyAdminPassword = (req, res) => {
    if (req.role !== 'admin') return res.status(403).send('Access denied');

    const { password } = req.body;

    // Fetch the admin's hashed password from the database
    const query = 'SELECT password FROM login WHERE role = "admin" LIMIT 1';
    db.query(query, (err, result) => {
        if (err) return res.status(500).send('Server error');
        if (result.length === 0) return res.status(500).send('Admin not found');

        const adminHashedPassword = result[0].password;
        const passwordIsValid = bcrypt.compareSync(password, adminHashedPassword);

        res.json({ isValid: passwordIsValid });
    });
};

module.exports = {addAdminDay, getAdminDay,deleteAdminDay, verifyAdminPassword};