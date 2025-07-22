const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authenticateFirebaseToken = require('../middleware/authenticateFirebaseToken');

// Log user activity
router.post('/log', authenticateFirebaseToken, activityController.logActivity);

module.exports = router; 