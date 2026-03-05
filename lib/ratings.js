const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadRatings() {
  ensureDataDir();
  if (!fs.existsSync(RATINGS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveRating(sessionId, messageIndex, rating) {
  const ratings = loadRatings();

  // Update existing or add new
  const existing = ratings.find(
    (r) => r.sessionId === sessionId && r.messageIndex === messageIndex
  );
  if (existing) {
    existing.rating = rating;
    existing.updatedAt = Date.now();
  } else {
    ratings.push({
      sessionId,
      messageIndex,
      rating,
      createdAt: Date.now(),
    });
  }

  fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
  return { success: true };
}

function getRatings(sessionId) {
  const ratings = loadRatings();
  if (!sessionId) return ratings;
  return ratings.filter((r) => r.sessionId === sessionId);
}

module.exports = { saveRating, getRatings };
