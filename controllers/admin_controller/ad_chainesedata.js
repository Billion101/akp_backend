const res = require('express/lib/response');
const db = require('../../config/db');
const req = require('express/lib/request');

const getUsersList = (req, res) => {
    const sql = 'SELECT id, username FROM login WHERE role = "user"';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};


const addAdminEntry = (req, res) => {
    const { dayId, userName, phoneNumber, totalPrice, totalWeight, totalM3, codes, userId } = req.body;

    const insertEntry = (userNameToInsert) => {
        const sql = `
            INSERT INTO admin_entries (day_id, user_name, phone_number, total_price, total_weight, total_m3, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [dayId, userNameToInsert, phoneNumber, totalPrice, totalWeight, totalM3, userId || null], (err, results) => {
            if (err) {
                console.error('Error saving user entry:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const entryId = results.insertId;

            // Filter out duplicate codes
            const uniqueCodes = codes.filter((code, index, self) =>
                index === self.findIndex((c) => c.code === code.code)
            );

            // Insert codes
            const codeInserts = uniqueCodes.map((code) => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO admin_codes (entry_id, code, weight, m3, color) VALUES (?, ?, ?, ?, ?)',
                        [entryId, code.code, code.weight || null, code.m3 || null, code.color || null],
                        (error, results) => {
                            if (error) {
                                return reject(error);
                            }
                            resolve(results);
                        }
                    );
                });
            });

            Promise.all(codeInserts)
                .then(() => {
                    res.json({ entryId, message: 'Entry added successfully' });
                })
                .catch((error) => {
                    console.error('Error inserting codes:', error);
                    res.status(500).json({ error: 'Failed to save codes' });
                });
        });
    };

    if (userId) {
        // If userId is provided, fetch the username from the login table
        db.query('SELECT username FROM login WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching username:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const fetchedUserName = results[0].username;
            insertEntry(fetchedUserName);
        });
    } else {
        // If userId is not provided, use the userName as before
        insertEntry(userName);
    }
};

const updateAdminEntry = (req, res) => {
    const entryId = req.params.id;
    const { userName, phoneNumber, totalPrice, totalWeight, totalM3, codes, userId } = req.body;

    const updateEntry = (userNameToUpdate) => {
        // Update the admin_entries table
        db.query(
            'UPDATE admin_entries SET user_name = ?, phone_number = ?, total_price = ?, total_weight = ?, total_m3 = ?, user_id = ? WHERE id = ?',
            [userNameToUpdate, phoneNumber, totalPrice, totalWeight, totalM3, userId || null, entryId],
            (error, results) => {
                if (error) {
                    console.error('Error updating the entry in admin_entries:', error);
                    return res.status(500).json({ success: false, error: 'Failed to update entry' });
                }

                // Delete existing codes for this entry
                db.query('DELETE FROM admin_codes WHERE entry_id = ?', [entryId], (error, results) => {
                    if (error) {
                        console.error('Error deleting existing codes:', error);
                        return res.status(500).json({ success: false, error: 'Failed to update entry' });
                    }

                    // Filter out duplicate codes
                    const uniqueCodes = codes.filter((code, index, self) =>
                        index === self.findIndex((c) => c.code === code.code)
                    );

                    // Insert the new codes
                    const codeInserts = uniqueCodes.map((code) => {
                        return new Promise((resolve, reject) => {
                            db.query(
                                'INSERT INTO admin_codes (entry_id, code, weight, m3, color) VALUES (?, ?, ?, ?, ?)',
                                [entryId, code.code, code.weight || null, code.m3 || null, code.color || null],
                                (error, results) => {
                                    if (error) {
                                        return reject(error);
                                    }
                                    resolve(results);
                                }
                            );
                        });
                    });

                    // Wait for all the insertions to complete
                    Promise.all(codeInserts)
                        .then(() => {
                            res.json({ success: true, message: 'Entry updated successfully' });
                        })
                        .catch((error) => {
                            console.error('Error inserting new codes:', error);
                            res.status(500).json({ success: false, error: 'Failed to update entry' });
                        });
                });
            }
        );
    };

    if (userId) {
        // If userId is provided, fetch the username from the login table
        db.query('SELECT username FROM login WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching username:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const fetchedUserName = results[0].username;
            updateEntry(fetchedUserName);
        });
    } else {
        // If userId is not provided, use the userName as before
        updateEntry(userName);
    }
};


const deleteAdminCode = (req, res) => {
    const codeId = req.params.id;

    const sql = 'DELETE FROM admin_codes WHERE id = ?';
    
    db.query(sql, [codeId], (err, result) => {
        if (err) {
            console.error('Error deleting code:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Code not found' });
        }
        
        res.json({ message: 'Code deleted successfully' });
    });
};

const deleteAdminEntry = (req, res) =>{
    const entryId = req.params.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error starting transaction', error: err });
        }

        // First, delete associated codes
        db.query('DELETE FROM admin_codes WHERE entry_id = ?', [entryId], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: 'Error deleting associated codes', error: err });
                });
            }

            // Then, delete the entry itself
            db.query('DELETE FROM admin_entries WHERE id = ?', [entryId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Error deleting entry', error: err });
                    });
                }

                // Commit the transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Error committing transaction', error: err });
                        });
                    }
                    res.status(200).json({ message: 'Entry and associated codes deleted successfully' });
                });
            });
        });
    });
}
const getAdminEntries = (req, res) => {
    const dayId = req.params.dayId;

    const sql = `
        SELECT ae.*, ac.code, ac.weight, ac.m3, ac.color
        FROM admin_entries ae
        LEFT JOIN admin_codes ac ON ae.id = ac.entry_id
        WHERE ae.day_id = ?
        ORDER BY ae.id, ac.id
    `;

    db.query(sql, [dayId], (err, results) => {
        if (err) {
            console.error('Error fetching admin entries:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Group the results by entry
        const entries = results.reduce((acc, row) => {
            if (!acc[row.id]) {
                acc[row.id] = {
                    id: row.id,
                    dayId: row.day_id,
                    userName: row.user_name,
                    phoneNumber: row.phone_number,
                    totalPrice: row.total_price,
                    totalWeight: row.total_weight,
                    totalM3: row.total_m3,
                    codes: []
                };
            }
            if (row.code) {
                acc[row.id].codes.push({
                    code: row.code,
                    weight: row.weight,
                    m3: row.m3,
                    color: row.color
                });
            }
            return acc;
        }, {});

        res.json(Object.values(entries));
    });
};


module.exports = {  addAdminEntry,deleteAdminCode,updateAdminEntry, getAdminEntries,deleteAdminEntry,getUsersList};