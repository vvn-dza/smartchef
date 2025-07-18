// server/scripts/uploadFilterAndIngredientCategories.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('../config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Load data
const filterCategories = JSON.parse(fs.readFileSync(path.join(__dirname, '../../client/src/data/filterCategories.json')));
const ingredientCategories = JSON.parse(fs.readFileSync(path.join(__dirname, '../../client/src/data/ingredientCategories.json')));

// Upload filterCategories as a single document
async function uploadFilterCategories() {
  await db.collection('filterCategories').doc('main').set(filterCategories);
  console.log('filterCategories uploaded!');
}

// Upload ingredientCategories as a collection
async function uploadIngredientCategories() {
  const batch = db.batch();
  ingredientCategories.categories.forEach(cat => {
    const docRef = db.collection('ingredientCategories').doc(cat.name);
    batch.set(docRef, cat);
  });
  await batch.commit();
  console.log('ingredientCategories uploaded!');
}

async function main() {
  await uploadFilterCategories();
  await uploadIngredientCategories();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
