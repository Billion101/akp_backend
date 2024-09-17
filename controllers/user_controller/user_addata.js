const res = require('express/lib/response');
const db = require('../../config/db');

const getUserEntries = (req, res) => {
    const dayId = req.params.dayId;
    const query = `
        SELECT ue.*, uc.code, uc.weight, uc.m3, ac.color
        FROM user_entrie ue
        LEFT JOIN user_code uc ON ue.id = uc.entry_id
        LEFT JOIN admin_codes ac ON uc.code = ac.code
        WHERE ue.day_id = ? AND ue.user_id = ?
    `;
    db.query(query, [dayId, req.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user entries:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const groupedEntries = results.reduce((acc, row) => {
            if (!acc[row.id]) {
                acc[row.id] = {
                    id: row.id,
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
                    color: row.color || '#000000'
                });
            }
            return acc;
        }, {});

        res.json(Object.values(groupedEntries));
    });
}

const addUserEntry = (req, res) => {
    const { dayId, userName, phoneNumber, totalPrice, totalWeight, totalM3 } = req.body;
    const userId = req.userId;

    // Check if the dayId exists in user_days
    const checkDayQuery = 'SELECT id FROM user_day WHERE id = ?';
    db.query(checkDayQuery, [dayId], (err, dayResult) => {
        if (err) {
            console.error('Error checking dayId:', err);
            return res.status(500).json({ error: 'Error checking dayId' });
        }

        if (dayResult.length === 0) {
            // If the dayId doesn't exist, insert a new one
            const insertDayQuery = 'INSERT INTO user_day (date, user_id) VALUES (CURDATE(), ?)';
            db.query(insertDayQuery, [userId], (err, result) => {
                if (err) {
                    console.error('Error inserting into user_day:', err);
                    return res.status(500).json({ error: 'Error inserting into user_days' });
                }

                const newDayId = result.insertId; // Get the newly inserted dayId

                // Now insert into user_entrie with the new dayId
                insertUserEntry(newDayId);
            });
        } else {
            // If the dayId exists, insert the user entry
            insertUserEntry(dayId);
        }
    });

    function insertUserEntry(dayId) {
        const query = `
            INSERT INTO user_entrie (day_id, user_id, user_name, phone_number, total_price, total_weight, total_m3)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [dayId, userId, userName, phoneNumber, totalPrice, totalWeight, totalM3], (err, result) => {
            if (err) {
                console.error('Error adding user entry:', err);
                return res.status(500).json({ error: 'Error adding user entry' });
            }
            res.json({ entryId: result.insertId });
        });
    }
}

const addUserCode = (req, res) => {
    const { entryId, codes } = req.body;
    console.log('Adding codes:', codes); // Log the incoming codes

    const query = 'INSERT INTO user_code (entry_id, code, weight, m3) VALUES ?';
    const values = codes.map(code => [entryId, code.code, code.weight, code.m3]); // Map codes for bulk insert

    db.query(query, [values], (err) => {
        if (err) {
            console.error('Error adding user codes:', err); // Log the error
            return res.status(500).json({ error: 'Error adding user codes' });
        }
        console.log('User codes added successfully');
        res.json({ message: 'Codes added successfully' });
    });
}

const updateUserEntry = (req, res) => {
    const entryId = req.params.id;
    const { userName, phoneNumber, totalPrice,totalWeight,totalM3, codes } = req.body;

    // Convert totalPrice to a string and ensure it's not longer than 20 characters
    const updatedTotalPrice = totalPrice ? totalPrice.toString().slice(0, 20) : '';

    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Update user_entrie table
        db.query(
            'UPDATE user_entrie SET user_name = ?, phone_number = ?, total_price = ?, total_weight = ?, total_m3 = ?  WHERE id = ? AND user_id = ?',
            [userName, phoneNumber, updatedTotalPrice,totalWeight,totalM3, entryId, req.userId],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating user entry:', err);
                        res.status(500).send('Internal Server Error');
                    });
                }
                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).send('Entry not found or not authorized');
                    });
                }

                // Delete existing codes for this entry
                db.query('DELETE FROM user_code WHERE entry_id = ?', [entryId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting existing codes:', err);
                            res.status(500).send('Internal Server Error');
                        });
                    }

                    // Insert new codes
                    const codeValues = codes.map(code => [entryId, code.code, code.weight, code.m3]);
                    db.query(
                        'INSERT INTO user_code (entry_id, code, weight, m3) VALUES ?',
                        [codeValues],
                        (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error inserting new codes:', err);
                                    res.status(500).send('Internal Server Error');
                                });
                            }

                            // Commit the transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        res.status(500).send('Internal Server Error');
                                    });
                                }
                                res.json({ message: 'User entry updated successfully!' });
                            });
                        }
                    );
                });
            }
        );
    });
}

const deleteUserCode =  (req, res) => {
    const { entryId, code } = req.params;

    db.query(
        'DELETE FROM user_code WHERE entry_id = ? AND code = ? AND entry_id IN (SELECT id FROM user_entrie WHERE user_id = ?)',
        [entryId, code, req.userId],
        (err, result) => {
            if (err) {
                console.error('Error deleting user code:', err);
                return res.status(500).send('Internal Server Error');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Code not found or not authorized');
            }
            res.json({ message: 'Code deleted successfully' });
        }
    );
}

const getAdminCode =(req, res) => {
    const code = req.params.code;
    db.query('SELECT weight, m3, color FROM admin_codes WHERE code = ?', [code], (err, results) => {
        if (err) {
            console.error('Error fetching admin code data:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Code not found' });
        }
        res.json(results[0]);
    });
}
const deleteUserEntry = (req, res) => {
    const entryId = req.params.id;
    // const userId = req.user.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Error starting transaction', error: err.message });
        }

        // First, delete associated codes
        db.query('DELETE FROM user_code WHERE entry_id = ?', [entryId], (err) => {
            if (err) {
                console.error('Error deleting codes:', err);
                return db.rollback(() => {
                    res.status(500).json({ message: 'Error deleting associated codes', error: err.message });
                });
            }

            // Then, delete the entry itself
            db.query('DELETE FROM user_entrie WHERE id = ? ', [entryId], (err, result) => {
                if (err) {
                    console.error('Error deleting entry:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Error deleting entry', error: err.message });
                    });
                }

                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(403).json({ message: 'You are not authorized to delete this entry' });
                    });
                }

                // Commit the transaction
                db.commit((err) => {
                    if (err) {
                        console.error('Commit error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Error committing transaction', error: err.message });
                        });
                    }
                    res.status(200).json({ message: 'Entry and associated codes deleted successfully' });
                });
            });
        });
    });
}

module.exports = {getUserEntries,getAdminCode,addUserCode,addUserEntry,deleteUserCode,updateUserEntry,deleteUserEntry}