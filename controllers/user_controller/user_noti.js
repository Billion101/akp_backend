const res = require('express/lib/response');
const db = require('../../config/db');


const userNoti = (req, res) => {
    const userId = req.user.id; // Assuming the user ID is stored in the token

    // Query to get all entries for the user, ordered by latest first using 'id'
    db.query(
        `SELECT id, total_price, total_weight, total_m3, created_at 
         FROM admin_entries 
         WHERE user_id = ? 
         ORDER BY id DESC`, // Order by 'id' since 'created_at' now exists
        [userId],
        (error, userEntries) => {
            if (error) {
                console.error('Error fetching user entries:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (userEntries.length === 0) {
                return res.status(404).json({ message: 'No notifications found for this user' });
            }

            // Get all entry IDs to fetch codes in one query
            const entryIds = userEntries.map(entry => entry.id);

            // Query to get all codes for the user's entries
            db.query(
                `SELECT entry_id, code, weight, m3, color 
                 FROM admin_codes 
                 WHERE entry_id IN (?) 
                 ORDER BY entry_id DESC`,
                [entryIds],
                (error, codes) => {
                    if (error) {
                        console.error('Error fetching codes:', error);
                        return res.status(500).json({ message: 'Internal server error' });
                    }

                    // Group codes by entry_id
                    const codesByEntry = codes.reduce((acc, code) => {
                        if (!acc[code.entry_id]) {
                            acc[code.entry_id] = [];
                        }
                        acc[code.entry_id].push({
                            code: code.code,
                            weight: code.weight,
                            m3: code.m3,
                            color: code.color
                        });
                        return acc;
                    }, {});

                    // Combine entries with their respective codes
                    const response = userEntries.map(entry => ({
                        id: entry.id,
                        totalPrice: entry.total_price,
                        totalWeight: entry.total_weight,
                        totalM3: entry.total_m3,
                        createdAt: entry.created_at, // Include the date field
                        codes: codesByEntry[entry.id] || []
                    }));

                    res.json(response);
                }
            );
        }
    );
};
const userNotiThai = (req, res) => {
    const userId = req.user.id; // Assuming the user ID is stored in the token

    // Query to get all entries for the user, ordered by latest first using 'id'
    db.query(
        `SELECT id, total_price, total_prices, created_at 
         FROM admin_thaientries 
         WHERE user_id = ? 
         ORDER BY id DESC`, // Order by 'id' since 'created_at' now exists
        [userId],
        (error, userEntries) => {
            if (error) {
                console.error('Error fetching user entries:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (userEntries.length === 0) {
                return res.status(404).json({ message: 'No notifications found for this user' });
            }

            // Get all entry IDs to fetch codes in one query
            const entryIds = userEntries.map(entry => entry.id);

            // Query to get all codes for the user's entries
            db.query(
                `SELECT entry_id, code, price 
                 FROM admin_thaicodes 
                 WHERE entry_id IN (?) 
                 ORDER BY entry_id DESC`,
                [entryIds],
                (error, codes) => {
                    if (error) {
                        console.error('Error fetching codes:', error);
                        return res.status(500).json({ message: 'Internal server error' });
                    }

                    // Group codes by entry_id
                    const codesByEntry = codes.reduce((acc, code) => {
                        if (!acc[code.entry_id]) {
                            acc[code.entry_id] = [];
                        }
                        acc[code.entry_id].push({
                            code: code.code,
                            price: code.price,
                            // m3: code.m3,
                            // color: code.color
                        });
                        return acc;
                    }, {});

                    // Combine entries with their respective codes
                    const response = userEntries.map(entry => ({
                        id: entry.id,
                        totalPrice: entry.total_price,
                        totalPrices: entry.total_prices,
                        // totalM3: entry.total_m3,
                        createdAt: entry.created_at, // Include the date field
                        codes: codesByEntry[entry.id] || []
                    }));

                    res.json(response);
                }
            );
        }
    );
};

module.exports = {userNoti,userNotiThai};