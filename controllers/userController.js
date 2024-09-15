// const db = require('../config/db');

// // Get user days
// const getUserDays = (req, res) => {
//     const userId = req.userId;
//     db.query('SELECT * FROM user_day WHERE user_id = ?', [userId], (err, results) => {
//         if (err) return res.status(500).json({ error: 'Internal server error' });
//         res.json(results);
//     });
// };

// // Add a user entry
// const addUserEntry = (req, res) => {
//     const { dayId, userName, phoneNumber, totalPrice, totalWeight, totalM3 } = req.body;
//     const userId = req.userId;

//     const query = `
//         INSERT INTO user_entrie (day_id, user_id, user_name, phone_number, total_price, total_weight, total_m3)
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//     `;
//     db.query(query, [dayId, userId, userName, phoneNumber, totalPrice, totalWeight, totalM3], (err, result) => {
//         if (err) return res.status(500).json({ error: 'Error adding user entry' });
//         res.json({ entryId: result.insertId });
//     });
// };

// // Add user codes
// const addUserCodes = (req, res) => {
//     const { entryId, codes } = req.body;
//     const query = 'INSERT INTO user_code (entry_id, code, weight, m3) VALUES ?';
//     const values = codes.map(code => [entryId, code.code, code.weight, code.m3]);

//     db.query(query, [values], (err) => {
//         if (err) return res.status(500).json({ error: 'Error adding user codes' });
//         res.json({ message: 'Codes added successfully' });
//     });
// };

// // Delete a user day
// const deleteUserDay = (req, res) => {
//     const { id } = req.params;
//     const deleteUserCodes = 'DELETE FROM user_code WHERE entry_id IN (SELECT id FROM user_entrie WHERE day_id = ?)';
//     const deleteUserEntries = 'DELETE FROM user_entrie WHERE day_id = ?';
//     const deleteUserDays = 'DELETE FROM user_day WHERE id = ?';

//     db.query(deleteUserCodes, [id, req.userId], (err) => {
//         if (err) return res.status(500).json({ error: 'Internal server error' });
//         db.query(deleteUserEntries, [id, req.userId], (err) => {
//             if (err) return res.status(500).json({ error: 'Internal server error' });
//             db.query(deleteUserDays, [id, req.userId], (err, result) => {
//                 if (err) return res.status(500).json({ error: 'Internal server error' });
//                 if (result.affectedRows === 0) return res.status(404).json({ error: 'Day not found' });
//                 res.json({ message: 'Day and associated data deleted successfully.' });
//             });
//         });
//     });
// };

// // Get user entries for a day
// const getUserEntries = (req, res) => {
//     const { dayId } = req.params;
//     const query = `
//         SELECT ue.*, uc.code, uc.weight, uc.m3
//         FROM user_entrie ue
//         LEFT JOIN user_code uc ON ue.id = uc.entry_id
//         WHERE ue.day_id = ? AND ue.user_id = ?
//     `;
//     db.query(query, [dayId, req.userId], (err, results) => {
//         if (err) return res.status(500).json({ error: 'Internal server error' });

//         const entries = results.reduce((acc, row) => {
//             if (!acc[row.id]) {
//                 acc[row.id] = {
//                     id: row.id,
//                     userName: row.user_name,
//                     phoneNumber: row.phone_number,
//                     totalPrice: row.total_price,
//                     totalWeight: row.total_weight,
//                     totalM3: row.total_m3,
//                     codes: []
//                 };
//             }
//             if (row.code) {
//                 acc[row.id].codes.push({
//                     code: row.code,
//                     weight: row.weight,
//                     m3: row.m3
//                 });
//             }
//             return acc;
//         }, {});

//         res.json(Object.values(entries));
//     });
// };

// module.exports = { getUserDays, addUserEntry, addUserCodes, deleteUserDay, getUserEntries };
