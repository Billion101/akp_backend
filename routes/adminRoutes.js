const express = require('express');
const { addUser, getUser, deleteUser, updateUser } = require('../controllers/admin_controller/ad_mannageuser');
const { addAdminDay, getAdminDay, deleteAdminDay, verifyAdminPassword } = require('../controllers/admin_controller/ad_home');
const verifyToken = require('../middlewares/verifyToken');
const { addAdminEntry, getAdminEntries, updateAdminEntry, deleteAdminCode } = require('../controllers/admin_controller/ad_addata');

const router = express.Router();
//admin mannage user
router.post('/addUser', verifyToken, addUser);
router.get('/getUser', verifyToken, getUser);
router.delete('/deleteUser/:id', verifyToken, deleteUser);
router.put('/updateUser/:id', verifyToken, updateUser);
//home admin
router.post('/addAdminDay', verifyToken, addAdminDay);
router.get('/getAdminDay', verifyToken, getAdminDay);
router.delete('/deleteAdminDay/:id', verifyToken, deleteAdminDay);
router.post('/verifyAdminPassword', verifyToken, verifyAdminPassword);
//admin data
router.post('/addAdminEntry', verifyToken, addAdminEntry);
router.get('/getAdminEntries/:dayId',verifyToken, getAdminEntries);
router.put('/updateAdminEntry/:id',verifyToken, updateAdminEntry);
router.delete('/deleteAdminCode/:id', verifyToken, deleteAdminCode)


module.exports = router;
