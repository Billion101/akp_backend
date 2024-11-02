const express = require('express');

const verifyToken = require('../middlewares/verifyToken');
const { getUserDay,addUserDay, deleteUserDay, totalUserPrice} = require('../controllers/user_controller/user_homechainese');
const  { getUserEntries, getAdminCode, addUserCode, addUserEntry, deleteUserCode, updateUserEntry, deleteUserEntry } = require('../controllers/user_controller/user_chainesedata');
const { getUserThaiEntries, addUserThaiEntry, addUserThaiCode, updateUserThaiEntry, deleteUserThaiCode, getAdminThaiCode, deleteUserThaiEntry } = require('../controllers/user_controller/user_thaidata');
const { getUserThaiDay, addUserThaiDay, deleteUserThaiDay, totalUserLaoPrice, totalUserThaiPrice } = require('../controllers/user_controller/user_homethai');
const { userNoti, userNotiThai } = require('../controllers/user_controller/user_noti');
const router = express.Router();
//home user
router.get('/getUserDay', verifyToken, getUserDay);
router.post('/addUserDay', verifyToken, addUserDay);
router.delete('/deleteUserDay/:id', verifyToken, deleteUserDay);
router.get('/totalUserPrice/:dayId',verifyToken,totalUserPrice);

//notifications
router.get('/notifications',verifyToken,userNoti);
router.get('/notificationsThai',verifyToken,userNotiThai);

//home thai user
router.get('/getUserthaiDay', verifyToken,getUserThaiDay );
router.post('/addUserthaiDay', verifyToken, addUserThaiDay);
router.delete('/deleteUserthaiDay/:id', verifyToken, deleteUserThaiDay);
router.get('/totalUserLaoPrice/:dayId',verifyToken,totalUserLaoPrice);
router.get('/totalUserThaiPrice/:dayId',verifyToken,totalUserThaiPrice);
//add chainese data user
router.get('/getUserEntries/:dayId',verifyToken, getUserEntries);
router.post('/addUserEntry', verifyToken, addUserEntry);
router.post('/addUserCode',verifyToken,addUserCode);
router.put('/updateUserEntry/:id',verifyToken,updateUserEntry);
router.delete('/deleteUserCode/:entryId/:code',verifyToken,deleteUserCode);
router.get('/getAdminCode/:code', verifyToken,getAdminCode);
router.delete('/deleteUserEntry/:id',verifyToken,deleteUserEntry);
// add thai data user
router.get('/getUserThaiEntries/:dayId',verifyToken, getUserThaiEntries);
router.post('/addUserThaiEntry', verifyToken, addUserThaiEntry);
router.post('/addUserThaiCode',verifyToken,addUserThaiCode);
router.put('/updateUserThaiEntry/:id',verifyToken,updateUserThaiEntry);
router.delete('/deleteUserThaiCode/:entryId/:code',verifyToken,deleteUserThaiCode);
router.get('/getAdminThaiCode/:code', verifyToken,getAdminThaiCode);
router.delete('/deleteUserThaiEntry/:id',verifyToken,deleteUserThaiEntry);

module.exports = router;
