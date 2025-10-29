const db = require('../../config/db');
const bcrypt = require('bcrypt');


// Add a day
const addAdminThaiDay = (req, res) => {
    const { date, title } = req.body;
    const sql = 'INSERT INTO admin_thaidays (date, title) VALUES (?, ?)';
    db.query(sql, [date, title || null], (err, result) => {
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
    const { title, date } = req.body;
    
    const sql = 'UPDATE admin_thaidays SET title = ?, date = ? WHERE id = ?';
    
    db.query(sql, [title || null, date, id], (err, result) => {
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
};const searchTHCode = (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  const query = `
    SELECT 
      ac.code,
      ae.day_id,
      ad.date,
      ad.title
    FROM admin_thaicodes ac
    JOIN admin_thaientries ae ON ac.entry_id = ae.id
    JOIN admin_thaidays ad ON ae.day_id = ad.id
    WHERE ac.code = ?
  `;

  db.query(query, [code], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Code not found' });
    }

    res.json(results[0]); // Or res.json(results) if multiple match
  });
};
const totalAdminThaiCodes = (req, res) => {
    const dayId = req.params.dayId; // Get dayId from URL

    // Query to count total codes for this day
    const query = `
        SELECT COUNT(admin_thaicodes.id) AS total_codes
        FROM admin_thaicodes
        JOIN admin_thaientries ON admin_thaientries.id = admin_thaicodes.entry_id
        WHERE admin_thaientries.day_id = ?
    `;

    db.query(query, [dayId], (error, results) => {
        if (error) {
            console.error('Error fetching total codes:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        // If no results, set count = 0
        const totalCodes = results[0]?.total_codes || 0;

        // Send response in the desired format
        return res.json({
            day_id: Number(dayId),
            total_codes: totalCodes
        });
    });
};
module.exports = {addAdminThaiDay, getAdminThaiDay,deleteAdminThaiDay,totalAdminLaoPrice,totalAdminThaiPrices,editAdminThaiDay,searchTHCode,totalAdminThaiCodes};