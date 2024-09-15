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

    // Start by deleting related data
    const deleteUserCodeQuery = `
        DELETE user_code 
        FROM user_code
        INNER JOIN user_entrie ON user_code.entry_id = user_entrie.id
        WHERE user_entrie.user_id = ?;
    `;

    const deleteUserEntriesQuery = `
        DELETE FROM user_entrie WHERE user_id = ?;
    `;

    const deleteUserDaysQuery = `
        DELETE FROM user_day WHERE user_id = ?;
    `;

    const deleteLoginQuery = `
        DELETE FROM login WHERE id = ?;
    `;

    // Use a transaction to ensure all queries are successful
    db.beginTransaction((err) => {
        if (err) return res.status(500).send('Transaction error');

        // Step 1: Delete user_code entries
        db.query(deleteUserCodeQuery, [id], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).send('Error deleting user codes');
                });
            }

            // Step 2: Delete user_entrie rows
            db.query(deleteUserEntriesQuery, [id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).send('Error deleting user entries');
                    });
                }

                // Step 3: Delete user_day rows
                db.query(deleteUserDaysQuery, [id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).send('Error deleting user days');
                        });
                    }

                    // Step 4: Delete user from login table
                    db.query(deleteLoginQuery, [id], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).send('Error deleting user login');
                            });
                        }

                        // If everything was successful, commit the transaction
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).send('Error committing transaction');
                                });
                            }
                            res.send('User and related data deleted successfully');
                        });
                    });
                });
            });
        });
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