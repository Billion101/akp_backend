const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Add a new user
const addUser = (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const role = 'user';

    const query = 'INSERT INTO login (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, role], (err) => {
        if (err) return res.status(500).send('Server error');
        res.send('User added successfully');
    });
};

// Get all users
const getUser = (req, res) => {
    const query = 'SELECT id, username, role FROM login';
    db.query(query, (err, result) => {
        if (err) return res.status(500).send('Server error');
        res.json(result);
    });
};

// Delete a user
const deleteUser = (req, res) => {
    const { id } = req.params;

    // Define all delete queries
    const queries = [
        // 1. Delete admin_thaicodes
        `DELETE admin_thaicodes FROM admin_thaicodes 
         INNER JOIN admin_thaientries ON admin_thaicodes.entry_id = admin_thaientries.id 
         WHERE admin_thaientries.user_id = ?`,
         
        // 2. Delete admin_codes
        `DELETE admin_codes FROM admin_codes 
         INNER JOIN admin_entries ON admin_codes.entry_id = admin_entries.id 
         WHERE admin_entries.user_id = ?`,
         
        // 3. Delete user_thaicode
        `DELETE user_thaicode FROM user_thaicode 
         INNER JOIN user_thaientrie ON user_thaicode.entry_id = user_thaientrie.id 
         WHERE user_thaientrie.user_id = ?`,
         
        // 4. Delete user_code
        `DELETE user_code FROM user_code 
         INNER JOIN user_entrie ON user_code.entry_id = user_entrie.id 
         WHERE user_entrie.user_id = ?`,
         
        // 5. Delete admin_thaientries
        `DELETE FROM admin_thaientries WHERE user_id = ?`,
        
        // 6. Delete admin_entries
        `DELETE FROM admin_entries WHERE user_id = ?`,
        
        // 7. Delete user_thaientrie
        `DELETE FROM user_thaientrie WHERE user_id = ?`,
        
        // 8. Delete user_entrie
        `DELETE FROM user_entrie WHERE user_id = ?`,
        
        // 9. Delete user_thaiday
        `DELETE FROM user_thaiday WHERE user_id = ?`,
        
        // 10. Delete user_day
        `DELETE FROM user_day WHERE user_id = ?`,
        
        // 11. Finally delete login
        `DELETE FROM login WHERE id = ?`
    ];

    // Start transaction
    db.beginTransaction((transErr) => {
        if (transErr) {
            console.error('Transaction error:', transErr);
            return res.status(500).json({ 
                error: 'Transaction error', 
                details: transErr.message 
            });
        }

        // Function to execute queries sequentially
        const executeQuery = (index) => {
            if (index >= queries.length) {
                // All queries completed successfully, commit transaction
                db.commit((commitErr) => {
                    if (commitErr) {
                        console.error('Commit error:', commitErr);
                        return db.rollback(() => {
                            res.status(500).json({ 
                                error: 'Error committing transaction', 
                                details: commitErr.message 
                            });
                        });
                    }
                    res.json({ message: 'User and all related data deleted successfully' });
                });
                return;
            }

            // Execute current query
            db.query(queries[index], [id], (queryErr, results) => {
                if (queryErr) {
                    console.error(`Error in query ${index + 1}:`, queryErr);
                    return db.rollback(() => {
                        res.status(500).json({ 
                            error: `Error in deletion step ${index + 1}`, 
                            details: queryErr.message 
                        });
                    });
                }

                // Move to next query
                executeQuery(index + 1);
            });
        };

        // Start executing queries
        executeQuery(0);
    });
};



// Update a user
const updateUser = (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    let query, queryParams;

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query = 'UPDATE login SET username = ?, password = ? WHERE id = ?';
        queryParams = [username, hashedPassword, id];
    } else {
        query = 'UPDATE login SET username = ? WHERE id = ?';
        queryParams = [username, id];
    }

    db.query(query, queryParams, (err, result) => {
        if (err) return res.status(500).send('Server error');
        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.send('User updated successfully');
    });
};

module.exports = { addUser, getUser, updateUser, deleteUser};