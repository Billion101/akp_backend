
// module.exports = router;
const express = require('express');
const axios = require('axios');
const db = require('../config/db');

const router = express.Router();

router.post('/check-tracking', async (req, res) => {
  const { search_no } = req.body;

  if (!search_no || typeof search_no !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing search_no' });
  }

  try {
    console.log(`[TRACKING] Starting tracking check for code: ${search_no}`);
    
    // 1. Call third-party tracking API
    const trackingRes = await axios.post('https://workers-playground-jolly-sunset-f7be.akplogisticsdev.workers.dev/', { search_no }, { timeout: 20000 });

    console.log(`[TRACKING] API response received for code ${search_no}:`, {
      success: trackingRes.data?.success,
      timesCount: trackingRes.data?.times?.length,
      package: trackingRes.data?.package,
      logistic: trackingRes.data?.logistic
    });

    const apiData = trackingRes.data;
    if (!apiData.success || !Array.isArray(apiData.times)) {
      console.log(`[TRACKING ERROR] Invalid API response for code ${search_no}:`, {
        success: apiData?.success,
        timesIsArray: Array.isArray(apiData?.times),
        times: apiData?.times
      });
      return res.status(404).json({ success: false, message: 'Tracking data not found' });
    }

    // 2. Format API steps (keep first 4 only)
    const customTitles = [
      'ສິນຄ້າໄດ້ຖືກເຊັນຮັບຢູ່ສາງຈີນແລ້ວ',
      'ສິນຄ້າກຳລັງເດີນທາງມານະຄອນຫລວງວຽງຈັນ',
      'ມື້ຄາດການຮອດນະຄອນຫລວງວຽງຈັນ',
      'ສິນຄ້າຢູ່ໃນຂັ້ນຕອນຂັດແຍກພັດສະດຸ'
    ];

    const steps = apiData.times.slice(0, 4).map((item, index) => ({
      title: customTitles[index] || item.title,
      date: item.date || null
    }));

    // 3. Check if tracking code exists in DB (any date)
    const checkQuery = `
      SELECT ac.code, ad.date
      FROM admin_codes ac
      JOIN admin_entries ae ON ae.id = ac.entry_id
      JOIN admin_days ad ON ad.id = ae.day_id
      WHERE ac.code = ?
      ORDER BY ad.date DESC
      LIMIT 1
    `;

    console.log(`[TRACKING] Checking database for code: ${search_no} (any date)`);

    db.query(checkQuery, [search_no], (err, result) => {
      if (err) {
        console.error(`[TRACKING ERROR] Database query failed for code ${search_no}:`, err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      console.log(`[TRACKING] Database query result for code ${search_no}:`, result);

      // 4. Add final step based on database result
      if (result.length > 0) {
        // Code found in database - ready for pickup
        const dbDate = result[0].date;
        console.log(`[TRACKING] Code ${search_no} found in database on date: ${dbDate} - adding pickup step`);
        
        // Format the database date as YYYY/MM/DD
        const dateObj = new Date(dbDate);
        const dateFormatted = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
        
        steps.push({
          title: 'ລູກຄ້າສາມາດເຂົ້າມາຮັບເຄື່ອງໄດ້ແລ້ວ',
          date: dateFormatted
        });
      } else {
        // Code NOT found in database - item is being sent
        console.log(`[TRACKING] Code ${search_no} NOT found in database - adding 'being sent' step`);
        
        steps.push({
          title: 'ສິນຄ້າກຳລັງສົ່ງມາ',
          date: null
        });
      }

      // 5. Send final structured response
      res.json({
        success: true,
        trackingNumber: apiData.package,
        steps,
        courier: apiData.logistic
      });
    });

  } catch (error) {
    console.error(`[TRACKING ERROR] Exception occurred for code ${search_no}:`, {
    //   message: error.message,
    //   code: error.code,
    //   response: error.response?.data,
    //   status: error.response?.status
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;