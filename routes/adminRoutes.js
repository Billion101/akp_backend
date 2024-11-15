const express = require('express');
const { addUser, getUser, deleteUser, updateUser } = require('../controllers/admin_controller/ad_mannageuser');
const { addAdminDay, getAdminDay, deleteAdminDay, verifyAdminPassword, totalAdminPrice, editAdminDay} = require('../controllers/admin_controller/ad_homechainese');
const verifyToken = require('../middlewares/verifyToken');
const { addAdminEntry, getAdminEntries, updateAdminEntry, deleteAdminCode, deleteAdminEntry, getUsersList } = require('../controllers/admin_controller/ad_chainesedata');
const { addAdminThaiEntry, getAdminThaiEntries, updateAdminThaiEntry, deleteAdminThaiCode, deleteAdminThaiEntry } = require('../controllers/admin_controller/ad_thaidata');
const { addAdminThaiDay, getAdminThaiDay, deleteAdminThaiDay, totalAdminLaoPrice, totalAdminThaiPrices, editAdminThaiDay } = require('../controllers/admin_controller/ad_homethai');

const router = express.Router();
//admin mannage user
router.post('/addUser', verifyToken, addUser);
router.get('/getUser', verifyToken, getUser);
router.delete('/deleteUser/:id', verifyToken, deleteUser);
router.put('/updateUser/:id', verifyToken, updateUser);
//home chainese admin
router.post('/addAdminDay', verifyToken, addAdminDay);
router.get('/getAdminDay', verifyToken, getAdminDay);
router.delete('/deleteAdminDay/:id', verifyToken, deleteAdminDay);
router.post('/verifyAdminPassword', verifyToken, verifyAdminPassword);
router.get('/totalAdminPrice/:dayId', verifyToken,totalAdminPrice);
router.put('/editAdminDay/:id',verifyToken,editAdminDay);
//home thai admin
router.post('/addAdminThaiDay', verifyToken, addAdminThaiDay);
router.get('/getAdminThaiDay', verifyToken, getAdminThaiDay);
router.delete('/deleteAdminThaiDay/:id', verifyToken, deleteAdminThaiDay);
router.get('/totalAdminLaoPrice/:dayId', verifyToken,totalAdminLaoPrice);
router.get('/totalAdminThaiPrice/:dayId', verifyToken,totalAdminThaiPrices);
router.put('/editAdminThaiDay/:id',verifyToken,editAdminThaiDay)
//chainese data
router.post('/addAdminEntry', verifyToken, addAdminEntry);
router.get('/getAdminEntries/:dayId',verifyToken, getAdminEntries);
router.put('/updateAdminEntry/:id',verifyToken, updateAdminEntry);
router.delete('/deleteAdminCode/:id', verifyToken, deleteAdminCode);
router.delete('/deleteAdminEntry/:id',verifyToken, deleteAdminEntry);
router.get('/getUserList', verifyToken,getUsersList)
//thai data
router.post('/addAdminThaiEntry', verifyToken, addAdminThaiEntry);
router.get('/getAdminThaiEntries/:dayId',verifyToken, getAdminThaiEntries);
router.put('/updateAdminThaiEntry/:id',verifyToken, updateAdminThaiEntry);
router.delete('/deleteAdminThaiCode/:id', verifyToken, deleteAdminThaiCode);
router.delete('/deleteAdminThaiEntry/:id',verifyToken, deleteAdminThaiEntry);


module.exports = router;
