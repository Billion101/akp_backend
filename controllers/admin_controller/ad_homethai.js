const db = require('../../config/db');
const bcrypt = require('bcrypt');


// Add a day
const addAdminThaiDay = (req, res) => {
    const { date } = req.body;
    const sql = 'INSERT INTO admin_thaidays (date) VALUES (?)';
    db.query(sql, [date], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ dayId: result.insertId });
    });
};

// Get all days
const getAdminThaiDay = (req, res) => {
    const sql = 'SELECT * FROM admin_thaidays';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};
const editAdminThaiDay = (req, res) => {
    const { id } = req.params;
    const { date } = req.body;
    
    const sql = 'UPDATE admin_thaidays SET date = ? WHERE id = ?';
    
    db.query(sql, [date, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Day not found' });
        }
        
        res.json({ success: true, message: 'Day updated successfully' });
    });
};

// Delete a day
const deleteAdminThaiDay = (req, res) => {
    const { id } = req.params;
    const deleteDays = 'DELETE FROM admin_thaidays WHERE id = ?';
    const deleteUserEntries = 'DELETE FROM admin_thaientries WHERE day_id = ?';
    const deleteUserCodes = 'DELETE FROM admin_thaicodes WHERE entry_id IN (SELECT id FROM admin_thaientries WHERE day_id = ?)';

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


const totalAdminLaoPrice = (req, res) => {
    const dayId = req.params.dayId; // Extract dayId from request parameters

    // Query to sum the total price for the given dayId
    const query = `
        SELECT SUM(total_price) AS total_sum 
        FROM admin_thaientries 
        WHERE day_id = ?
    `;

    db.query(query, [dayId], (error, results) => {
        if (error) {
            console.error('Error fetching total price:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        // If no entries found, set total_sum to '0.00'
        const totalPrice = results[0]?.total_sum || '0';

        // Format the total price to match your desired output
        const formattedTotalPrice = totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Send the response with formatted total price
        return res.json({ total_sum: formattedTotalPrice });
    });
};

const totalAdminThaiPrices = (req, res) => {
    const dayId = req.params.dayId; // Extract dayId from request parameters

    // Query to sum the total price for the given dayId
    const query = `
        SELECT SUM(total_prices) AS total_sum 
        FROM admin_thaientries 
        WHERE day_id = ?
    `;

    db.query(query, [dayId], (error, results) => {
        if (error) {
            console.error('Error fetching total price:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        // If no entries found, set total_sum to '0.00'
        const totalPrice = results[0]?.total_sum || '0';

        // Format the total price to match your desired output
        const formattedTotalPrice = totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Send the response with formatted total price
        return res.json({ total_sum: formattedTotalPrice });
    });
};

module.exports = {addAdminThaiDay, getAdminThaiDay,deleteAdminThaiDay,totalAdminLaoPrice,totalAdminThaiPrices,editAdminThaiDay};