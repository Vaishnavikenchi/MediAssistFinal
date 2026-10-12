const express = require('express');
const router = express.Router();
const { login, register, verifyToken, logout } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/verify', verifyToken);

module.exports = router;