const express = require('express');

const verifyToken = require('../middlewares/verifyToken');
const { getUserDay,addUserDay, deleteUserDay, getNotiFormAdmin } = require('../controllers/user_controller/user_home');
const  { getUserEntries, getAdminCode, addUserCode, addUserEntry, deleteUserCode, updateUserEntry, deleteUserEntry } = require('../controllers/user_controller/user_addata')
const router = express.Router();
//home user
router.get('/getUserDay', verifyToken, getUserDay);
router.post('/addUserDay', verifyToken, addUserDay);
router.delete('/deleteUserDay/:id', verifyToken, deleteUserDay);
router.get('/getNotiFormAdmin', verifyToken, getNotiFormAdmin);

//add data user
router.get('/getUserEntries/:dayId',verifyToken, getUserEntries);
router.post('/addUserEntry', verifyToken, addUserEntry);
router.post('/addUserCode',verifyToken,addUserCode);
router.put('/updateUserEntry/:id',verifyToken,updateUserEntry);
router.delete('/deleteUserCode/:entryId/:code',verifyToken,deleteUserCode);
router.get('/getAdminCode/:code', verifyToken,getAdminCode);
router.delete('/deleteUserEntry/:id',verifyToken,deleteUserEntry);


module.exports = router;
