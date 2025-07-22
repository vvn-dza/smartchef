const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Scoring weights
const SCORE_MAP = {
  save: 3,
  remove: -3,
  search: 2,
  ai_search: 1,
};

const TOP_N = 5;

async function generateRecommendationsForAllUsers() {
  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const activitySnap = await db
      .collection('users')
      .doc(userId)
      .collection('activityLogs')
      .get();
    const scores = {};
    activitySnap.forEach((logDoc) => {
      const { type, recipeId } = logDoc.data();
      if (!recipeId) return;
      if (!scores[recipeId]) scores[recipeId] = 0;
      scores[recipeId] += SCORE_MAP[type] || 0;
    });
    // Sort recipes by score
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N);
    // Write recommendations
    const recsCol = db
      .collection('users')
      .doc(userId)
      .collection('recommendations');
    // Clear old recommendations
    const oldRecs = await recsCol.get();
    const batch = db.batch();
    oldRecs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // Add new recommendations
    for (const [recipeId, score] of sorted) {
      await recsCol.add({ recipeId, score, generatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    console.log(`Updated recommendations for user ${userId}`);
  }
  console.log('All user recommendations updated.');
}

if (require.main === module) {
  generateRecommendationsForAllUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} 