const res = require('express/lib/response');
const db = require('../../config/db');
const req = require('express/lib/request');

const addAdminEntry = (req, res) => {
    const { dayId, userName, phoneNumber, totalPrice, totalWeight, totalM3, codes } = req.body;

    // Insert the main entry into admin_entries table
    const sql = `
        INSERT INTO admin_entries (day_id, user_name, phone_number, total_price, total_weight, total_m3)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [dayId, userName, phoneNumber, totalPrice, totalWeight, totalM3], (err, results) => {
        if (err) {
            console.error('Error saving user entry:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const entryId = results.insertId;

        // Filter out duplicate codes by checking if they already exist in the admin_codes table
        const uniqueCodes = codes.filter((code, index, self) =>
            index === self.findIndex((c) => c.code === code.code)
        );

        const codeInserts = uniqueCodes.map((code) => {
            const weight = code.weight || null;
            const m3 = code.m3 || null;

            return new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO admin_codes (entry_id, code, weight, m3, color) VALUES (?, ?, ?, ?, ?)',
                    [entryId, code.code, weight, m3, code.color],
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
                res.json({ entryId });
            })
            .catch((error) => {
                console.error('Error inserting codes into admin_codes:', error);
                res.status(500).json({ error: 'Failed to save codes' });
            });
    });
};




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

const updateAdminEntry = (req, res) => {
    const entryId = req.params.id;
    const { userName, phoneNumber, totalPrice, totalWeight, totalM3, codes } = req.body;

    // Update the admin_entries table
    db.query(
        'UPDATE admin_entries SET user_name = ?, phone_number = ?, total_price = ?, total_weight = ?, total_m3 = ? WHERE id = ?',
        [userName, phoneNumber, totalPrice, totalWeight, totalM3, entryId],
        (error, results) => {
            if (error) {
                console.error('Error updating the entry in admin_entries:', error);
                return res.status(500).json({ success: false, error: 'Failed to update entry' });
            }

            // Delete existing codes for this entry
            db.query('DELETE FROM admin_codes WHERE entry_id = ?', [entryId], (error, results) => {
                if (error) {
                    console.error('Error deleting codes from admin_codes:', error);
                    return res.status(500).json({ success: false, error: 'Failed to update entry' });
                }

                // Filter out duplicate codes by checking if they already exist in the admin_codes table
                const uniqueCodes = codes.filter((code, index, self) =>
                    index === self.findIndex((c) => c.code === code.code)
                );

                // Insert the new codes with the updated color
                const codeInserts = uniqueCodes.map((code) => {
                    return new Promise((resolve, reject) => {
                        db.query(
                            'INSERT INTO admin_codes (entry_id, code, weight, m3, color) VALUES (?, ?, ?, ?, ?)',
                            [entryId, code.code, code.weight, code.m3, code.color],
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
                        res.json({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error inserting codes into admin_codes:', error);
                        res.status(500).json({ success: false, error: 'Failed to update entry' });
                    });
            });
        }
    );
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



module.exports = {  addAdminEntry,deleteAdminCode,updateAdminEntry, getAdminEntries,deleteAdminEntry};