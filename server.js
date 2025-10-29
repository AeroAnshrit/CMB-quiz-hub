require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use async file system
const glob = require('glob'); // Make sure you ran: npm install glob

const app = express();
const port = 3000;

// --- In-Memory Cache ---
// This will store all your quiz data when the server starts.
const quizCache = {
    subjects: {}, // e.g., { mechanical: [{...}], cs: [{...}] }
    years: {},    // e.g., { mechanical: [{...}], cs: [{...}] }
    quizzes: {},  // e.g., { mechanical: { thermo: {...} } }
    yearWise: {}, // e.g., { mechanical: { 'ISRO-2023': {...} } }
    content: {}   // e.g., { allAboutIsro: {...} }
};

// --- Caching Functions ---

async function loadJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Error loading JSON from ${filePath}:`, e.message);
        return null; // Don't crash the server, just log the error
    }
}

app.get('/api/subjects/:exam/:branch', (req, res) => {
  const { exam, branch } = req.params;
  const filePath = path.join(__dirname, 'data', 'quizzes', exam, branch, 'subjects.json');
  sendJsonFile(res, filePath);
});

app.get('/api/years/:exam/:branch', (req, res) => {
  const { exam, branch } = req.params;
  const filePath = path.join(__dirname, 'data', 'yearWise', exam, branch, 'years.json');
  sendJsonFile(res, filePath);
});

app.get('/api/quiz/:exam/:branch/:subjectKey', (req, res) => {
  const { exam, branch, subjectKey } = req.params;
  const filePath = path.join(__dirname, 'data', 'quizzes', exam, branch, `${subjectKey}.json`);
  sendJsonFile(res, filePath);
});

app.get('/api/year-wise/:exam/:branch/:yearKey', (req, res) => {
  const { exam, branch, yearKey } = req.params;
  const filePath = path.join(__dirname, 'data', 'yearWise', exam, branch, `${yearKey}.json`);
  sendJsonFile(res, filePath);
});

app.get('/api/content/:pageKey', (req, res) => {
  const { pageKey } = req.params;
  const filePath = path.join(__dirname, 'data', 'content', `${pageKey}.json`);
  sendJsonFile(res, filePath);
});

// --- NEW SEARCH ENDPOINT ---
const glob = require('fast-glob');
const searchCache = { all: [] }; // Initialize with an empty array
async function cacheAllData() {
    console.log('Starting to cache all quiz data...');

    // 1. Cache Content (allAboutIsro.json, etc.)
    const contentFiles = glob.sync('data/content/*.json');
    for (const file of contentFiles) {
        const key = path.basename(file, '.json'); // 'allAboutIsro'
        const data = await loadJson(file);
        if (data) quizCache.content[key] = data;
    }

    // Get all branches (mechanical, cs, etc.)
    const branches = glob.sync('data/quizzes/isro/*').map(p => path.basename(p));

    for (const branch of branches) {
        // 2. Cache Subjects (subjects.json for each branch)
        const subjectsData = await loadJson(`data/quizzes/isro/${branch}/subjects.json`);
        if (subjectsData) quizCache.subjects[branch] = subjectsData;

        // 3. Cache Years (years.json for each branch)
        const yearsData = await loadJson(`data/yearWise/isro/${branch}/years.json`);
        if (yearsData) quizCache.years[branch] = yearsData;

        // 4. Cache Topic Quizzes (thermodynamics.json, etc.)
        quizCache.quizzes[branch] = {};
        const quizFiles = glob.sync(`data/quizzes/isro/${branch}/*.json`);
        for (const file of quizFiles) {
            const key = path.basename(file, '.json');
            if (key !== 'subjects') {
                const data = await loadJson(file);
                if (data) quizCache.quizzes[branch][key] = data;
            }
        }

        // 5. Cache Year-Wise Quizzes (ISRO-2023.json, etc.)
        quizCache.yearWise[branch] = {};
        const yearFiles = glob.sync(`data/yearWise/isro/${branch}/*.json`);
        for (const file of yearFiles) {
            const key = path.basename(file, '.json');
            if (key !== 'years') {
                const data = await loadJson(file);
                if (data) quizCache.yearWise[branch][key] = data;
            }
        }
    }

    console.log('--- Caching Complete ---');
}

// The API Route
app.get('/api/search', (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json([]);
// --- API ROUTES ---
// These routes read from the cache, making them very fast.

// GET /api/subjects/mechanical
app.get('/api/subjects/:branch', (req, res) => {
    const { branch } = req.params;
    const data = quizCache.subjects[branch];
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: `Data not found for subjects in branch: ${branch}` });
    }
});

// GET /api/years/mechanical
app.get('/api/years/:branch', (req, res) => {
    const { branch } = req.params;
    const data = quizCache.years[branch];
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: `Data not found for years in branch: ${branch}` });
    }
});

// GET /api/quiz/mechanical/thermodynamics
app.get('/api/quiz/:branch/:key', (req, res) => {
    const { branch, key } = req.params;
    const data = quizCache.quizzes[branch]?.[key];
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: `Quiz not found for: ${branch}/${key}` });
    }
});

    if (!searchCache.all) {
      return res.status(503).json({ error: 'Search cache is building. Please try again in a moment.' });
    }

    const results = searchCache.all.filter(q =>
      q.question.toLowerCase().includes(query) ||
      q.explanation.toLowerCase().includes(query)
    );

    // Limit to 50 results to avoid overwhelming the client
    res.json(results.slice(0, 50));
  } catch (error) {
    console.error('Error in /api/search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
// GET /api/year-wise/mechanical/ISRO-2023
app.get('/api/year-wise/:branch/:key', (req, res) => {
    const { branch, key } = req.params;
    const data = quizCache.yearWise[branch]?.[key];
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: `Year-wise quiz not found for: ${branch}/${key}` });
    }
});

// GET /api/content/allAboutIsro
app.get('/api/content/:key', (req, res) => {
    const { key } = req.params;
    const data = quizCache.content[key];
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: `Content not found for: ${key}` });
    }
});

// --- Static File Serving ---
// This serves your index.html, css, and client-side js
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: send index.html for any other request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    buildSearchCache(); // Build the cache when the server starts
  });
}

module.exports = { app, buildSearchCache, searchCache };
// --- Start Server ---
// We must start the server *after* the data is cached
cacheAllData().then(() => {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
