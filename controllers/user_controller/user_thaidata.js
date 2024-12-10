const res = require('express/lib/response');
const db = require('../../config/db');

const getUserThaiEntries = (req, res) => {
    const dayId = req.params.dayId;
    const query = `
        SELECT ue.*, uc.code, uc.price
        FROM user_thaientrie ue
        LEFT JOIN user_thaicode uc ON ue.id = uc.entry_id
        WHERE ue.day_id = ? AND ue.user_id = ?
    `;
    db.query(query, [dayId, req.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user Thai entries:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const groupedEntries = results.reduce((acc, row) => {
            if (!acc[row.id]) {
                acc[row.id] = {
                    id: row.id,
                    userName: row.user_name,
                    phoneNumber: row.phone_number,
                    totalPrice: row.total_price,
                    totalPriceThai: row.total_prices,
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

        res.json(Object.values(groupedEntries));
    });
}

const addUserThaiEntry = (req, res) => {
    const { dayId, userName, phoneNumber, totalPrice, totalPriceThai } = req.body;
    const userId = req.userId;

    // Check if the dayId exists in user_days
    const checkDayQuery = 'SELECT id FROM user_thaiday WHERE id = ?';
    db.query(checkDayQuery, [dayId], (err, dayResult) => {
        if (err) {
            console.error('Error checking dayId:', err);
            return res.status(500).json({ error: 'Error checking dayId' });
        }

        if (dayResult.length === 0) {
            // If the dayId doesn't exist, insert a new one
            const insertDayQuery = 'INSERT INTO user_thaiday (date, user_id) VALUES (CURDATE(), ?)';
            db.query(insertDayQuery, [userId], (err, result) => {
                if (err) {
                    console.error('Error inserting into user_day:', err);
                    return res.status(500).json({ error: 'Error inserting into user_days' });
                }

                const newDayId = result.insertId;
                insertUserThaiEntry(newDayId);
            });
        } else {
            insertUserThaiEntry(dayId);
        }
    });

    function insertUserThaiEntry(dayId) {
        const query = `
            INSERT INTO user_thaientrie (day_id, user_id, user_name, phone_number, total_price, total_prices)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [dayId, userId, userName, phoneNumber, totalPrice, totalPriceThai], (err, result) => {
            if (err) {
                console.error('Error adding user Thai entry:', err);
                return res.status(500).json({ error: 'Error adding user Thai entry' });
            }
            res.json({ entryId: result.insertId });
        });
    }
}

const addUserThaiCode = (req, res) => {
    const { entryId, codes } = req.body;
    console.log('Adding Thai codes:', codes);

    const query = 'INSERT INTO user_thaicode (entry_id, code, price) VALUES ?';
    const values = codes.map(code => [entryId, code.code, code.price]);

    db.query(query, [values], (err) => {
        if (err) {
            console.error('Error adding user Thai codes:', err);
            return res.status(500).json({ error: 'Error adding user Thai codes' });
        }
        console.log('User Thai codes added successfully');
        res.json({ message: 'Thai codes added successfully' });
    });
}

const updateUserThaiEntry = (req, res) => {
    const entryId = req.params.id;
    const { userName, phoneNumber, totalPrice, totalPriceThai, codes } = req.body;

    const updatedTotalPrice = totalPrice ? totalPrice.toString().slice(0, 20) : '';
    const updatedTotalPriceThai = totalPriceThai ? totalPriceThai.toString().slice(0, 20) : '';

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send('Internal Server Error');
        }

        db.query(
            'UPDATE user_thaientrie SET user_name = ?, phone_number = ?, total_price = ?, total_prices = ? WHERE id = ? AND user_id = ?',
            [userName, phoneNumber, updatedTotalPrice, updatedTotalPriceThai, entryId, req.userId],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating user Thai entry:', err);
                        res.status(500).send('Internal Server Error');
                    });
                }
                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).send('Entry not found or not authorized');
                    });
                }

                db.query('DELETE FROM user_thaicode WHERE entry_id = ?', [entryId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting existing Thai codes:', err);
                            res.status(500).send('Internal Server Error');
                        });
                    }

                    const codeValues = codes.map(code => [entryId, code.code, code.price]);
                    db.query(
                        'INSERT INTO user_thaicode (entry_id, code, price) VALUES ?',
                        [codeValues],
                        (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error inserting new Thai codes:', err);
                                    res.status(500).send('Internal Server Error');
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        res.status(500).send('Internal Server Error');
                                    });
                                }
                                res.json({ message: 'User Thai entry updated successfully!' });
                            });
                        }
                    );
                });
            }
        );
    });
}

const deleteUserThaiCode = (req, res) => {
    const { entryId, code } = req.params;

    db.query(
        'DELETE FROM user_thaicode WHERE entry_id = ? AND code = ? AND entry_id IN (SELECT id FROM user_thaientrie WHERE user_id = ?)',
        [entryId, code, req.userId],
        (err, result) => {
            if (err) {
                console.error('Error deleting user Thai code:', err);
                return res.status(500).send('Internal Server Error');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Code not found or not authorized');
            }
            res.json({ message: 'Thai code deleted successfully' });
        }
    );
}

const getAdminThaiCode = (req, res) => {
    const code = req.params.code;

    if (!code) {
        return res.status(400).json({ error: 'Code parameter is missing' });
    }

    db.query('SELECT price FROM admin_thaicodes WHERE code = ?', [code], (err, results) => {
        if (err) {
            console.error('Error fetching admin Thai code data for code:', code, err);
            return res.status(500).json({ error: 'Internal server error while fetching code data' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: `Code ${code} not found` });
        }
        res.json(results[0]);
    });
};

const deleteUserThaiEntry = (req, res) => {
    const entryId = req.params.id;
    
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Error starting transaction', error: err.message });
        }

        db.query('DELETE FROM user_thaicode WHERE entry_id = ?', [entryId], (err) => {
            if (err) {
                console.error('Error deleting Thai codes:', err);
                return db.rollback(() => {
                    res.status(500).json({ message: 'Error deleting associated Thai codes', error: err.message });
                });
            }

            db.query('DELETE FROM user_thaientrie WHERE id = ?', [entryId], (err, result) => {
                if (err) {
                    console.error('Error deleting Thai entry:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Error deleting Thai entry', error: err.message });
                    });
                }

                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(403).json({ message: 'You are not authorized to delete this entry' });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        console.error('Commit error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Error committing transaction', error: err.message });
                        });
                    }
                    res.status(200).json({ message: 'Thai entry and associated codes deleted successfully' });
                });
            });
        });
    });
}

module.exports = {
    getUserThaiEntries,
    getAdminThaiCode,
    addUserThaiCode,
    addUserThaiEntry,
    deleteUserThaiCode,
    updateUserThaiEntry,
    deleteUserThaiEntry
}