
const res = require('express/lib/response');
const db = require('../../config/db');
const req = require('express/lib/request');

const addAdminThaiEntry = (req, res) => {
    const { dayId, userName, phoneNumber, totalPrice, totalPrices, codes, userId } = req.body;

    const insertThaiEntry = (userNameToInsert) => {
        const sql = `
            INSERT INTO admin_thaientries (day_id, user_name, phone_number, total_price, total_prices, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [dayId, userNameToInsert, phoneNumber, totalPrice, totalPrices, userId || null], (err, results) => {
            if (err) {
                console.error('Error saving Thai entry:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const entryId = results.insertId;

            const uniqueCodes = codes.filter((code, index, self) =>
                index === self.findIndex((c) => c.code === code.code)
            );

            const codeInserts = uniqueCodes.map((code) => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO admin_thaicodes (entry_id, code, price) VALUES (?, ?, ?)',
                        [entryId, code.code, code.price || null],
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
                    res.json({ entryId, message: 'Thai entry added successfully' });
                })
                .catch((error) => {
                    console.error('Error inserting codes into admin_thaicodes:', error);
                    res.status(500).json({ error: 'Failed to save codes' });
                });
        });
    };

    if (userId) {
        db.query('SELECT username FROM login WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching username:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const fetchedUserName = results[0].username;
            insertThaiEntry(fetchedUserName);
        });
    } else {
        insertThaiEntry(userName);
    }
};

const updateAdminThaiEntry = (req, res) => {
    const entryId = req.params.id;
    const { userName, phoneNumber, totalPrice, totalPrices, codes, userId } = req.body;

    const updateThaiEntry = (userNameToUpdate) => {
        db.query(
            'UPDATE admin_thaientries SET user_name = ?, phone_number = ?, total_price = ?, total_prices = ?, user_id = ? WHERE id = ?',
            [userNameToUpdate, phoneNumber, totalPrice, totalPrices, userId || null, entryId],
            (error, results) => {
                if (error) {
                    console.error('Error updating Thai entry in admin_thaientries:', error);
                    return res.status(500).json({ success: false, error: 'Failed to update entry' });
                }

                db.query('DELETE FROM admin_thaicodes WHERE entry_id = ?', [entryId], (error, results) => {
                    if (error) {
                        console.error('Error deleting existing codes in admin_thaicodes:', error);
                        return res.status(500).json({ success: false, error: 'Failed to update entry' });
                    }

                    const uniqueCodes = codes.filter((code, index, self) =>
                        index === self.findIndex((c) => c.code === code.code)
                    );

                    const codeInserts = uniqueCodes.map((code) => {
                        return new Promise((resolve, reject) => {
                            db.query(
                                'INSERT INTO admin_thaicodes (entry_id, code, price) VALUES (?, ?, ?)',
                                [entryId, code.code, code.price || null],
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
                            res.json({ success: true, message: 'Thai entry updated successfully' });
                        })
                        .catch((error) => {
                            console.error('Error inserting codes into admin_thaicodes:', error);
                            res.status(500).json({ success: false, error: 'Failed to update entry' });
                        });
                });
            }
        );
    };

    if (userId) {
        db.query('SELECT username FROM login WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching username:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const fetchedUserName = results[0].username;
            updateThaiEntry(fetchedUserName);
        });
    } else {
        updateThaiEntry(userName);
    }
};



const getAdminThaiEntries = (req, res) => {
    const dayId = req.params.dayId;

    const sql = `
        SELECT ae.*, ac.code, ac.price
        FROM admin_thaientries ae
        LEFT JOIN admin_thaicodes ac ON ae.id = ac.entry_id
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
                    totalPrices: row.total_prices,
                    codes: []
                };
            }
            if (row.code) {
                acc[row.id].codes.push({
                    code: row.code,
                    price: row.price
                });
            }
            return acc;
        }, {});

        res.json(Object.values(entries));
    });
};



const deleteAdminThaiCode = (req, res) => {
    const codeId = req.params.id;

    const sql = 'DELETE FROM admin_thaicodes WHERE id = ?';
    
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

const deleteAdminThaiEntry = (req, res) =>{
    const entryId = req.params.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error starting transaction', error: err });
        }

        // First, delete associated codes
        db.query('DELETE FROM admin_thaicodes WHERE entry_id = ?', [entryId], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: 'Error deleting associated codes', error: err });
                });
            }

            // Then, delete the entry itself
            db.query('DELETE FROM admin_thaientries WHERE id = ?', [entryId], (err) => {
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
};

module.exports = { addAdminThaiEntry, deleteAdminThaiCode, updateAdminThaiEntry, getAdminThaiEntries, deleteAdminThaiEntry };