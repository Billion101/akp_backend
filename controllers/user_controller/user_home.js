const db = require('../../config/db');

const getUserDay = (req, res) => {
    const userId = req.userId;
    db.query('SELECT * FROM user_day WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });
        res.json(results);
    });
};

const addUserDay = (req, res) => {
    const { date } = req.body;
    db.query('INSERT INTO user_day (date, user_id) VALUES (?, ?)', [date, req.userId], (err, result) => {
        if (err) {
            console.error('Error adding user day:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ dayId: result.insertId });
    });
};

const deleteUserDay = (req, res) => {
    const { id } = req.params;

    const deleteUserCodes = 'DELETE FROM user_code WHERE entry_id IN (SELECT id FROM user_entrie WHERE day_id = ?)';
    const deleteUserEntries = 'DELETE FROM user_entrie WHERE day_id = ?';
    const deleteUserDays = 'DELETE FROM user_day WHERE id = ? ';

    // Delete codes related to entries of the day
    db.query(deleteUserCodes, [id, req.userId], (err) => {
        if (err) {
            console.error('Error deleting user codes:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Delete entries related to the day
        db.query(deleteUserEntries, [id, req.userId], (err) => {
            if (err) {
                console.error('Error deleting user entries:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Finally, delete the day itself
            db.query(deleteUserDays, [id, req.userId], (err, result) => {
                if (err) {
                    console.error('Error deleting user day:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Day not found or not authorized' });
                }

                res.json({ message: 'Day and associated data deleted successfully.' });
            });
        });
    });
}

const getNotiFormAdmin = (req, res) => {
    // Log to see if req.user exists
    console.log(req.user);  // Ensure req.user is populated

    // Use the user ID from the request (assuming it's set by some middleware)
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);  // Log the exact error
            return res.status(500).json({ message: 'Error fetching notifications' });
        }
        res.json(results);
    });
};



module.exports = {getUserDay,addUserDay,deleteUserDay,getNotiFormAdmin};