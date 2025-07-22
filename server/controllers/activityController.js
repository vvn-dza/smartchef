const admin = require('firebase-admin');

// Log user activity
exports.logActivity = async (req, res) => {
  try {
    const { userId, type, recipeId, query } = req.body;
    
    // Validate required fields
    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }

    // Validate activity type
    const validTypes = ['save', 'remove', 'search', 'ai_search'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }

    const logData = {
      type,
      recipeId: recipeId || null,
      query: query || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use a batch write for better performance
    const batch = admin.firestore().batch();
    const logRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('activityLogs')
      .doc(); // Auto-generate ID

    batch.set(logRef, logData);
    await batch.commit();

    console.log(`Activity logged: ${type} for user ${userId}`);
    res.status(201).json({ 
      message: 'Activity logged successfully', 
      logId: logRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to log activity',
      message: 'Please try again later'
    });
  }
}; 