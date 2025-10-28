require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

// --- Security Middleware ---
// Use Helmet to set various security-related HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], 
      "img-src": ["'self'", "data:"], // Allow images from self and data URIs
    },
  },
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Generic file reader function to avoid repetition
async function sendJsonFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    res.status(404).json({ error: `Data not found for path: ${filePath}` });
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
const searchCache = {}; // Simple cache to store all questions

async function buildSearchCache() {
    console.log('Building search cache...');
    const quizFiles = await glob('data/{quizzes,yearWise}/**/*.json');
    let allQuestions = [];

    for (const file of quizFiles) {
        // We only want to search *question* files, not list files
        if (file.endsWith('subjects.json') || file.endsWith('years.json')) {
            continue;
        }

        try {
            const data = await fs.readFile(file, 'utf8');
            const jsonData = JSON.parse(data);
            
            // Extract context from the file path
            // e.g., data/quizzes/isro/mechanical/fluid_mechanics.json
            const parts = file.split('/');
            // parts[0] = data
            // parts[1] = quizzes or yearWise
            
            let exam, branch, key, type;
            type = parts[1] === 'quizzes' ? 'topic' : 'year';

            // Check for new structure: data/quizzes/isro/mechanical/file.json
            if (parts.length === 5) { 
                exam = parts[2];
                branch = parts[3];
                key = parts[4].replace('.json', '');
            } 
            // Check for original structure: data/quizzes/maths/file.json
            else if (parts.length === 4) {
                exam = 'general'; // Assign a default 'exam'
                branch = parts[2]; // e.g., 'maths' or 'aptitude'
                key = parts[3].replace('.json', '');
            } else {
                console.warn(`Skipping file with unexpected path structure: ${file}`);
                continue;
            }

            if (jsonData.questions && jsonData.questions.length > 0) {
                jsonData.questions.forEach((q, index) => {
                    allQuestions.push({
                        // Question data
                        question: q.question,
                        explanation: q.explanation || '',
                        // Context to find it again
                        exam: exam,
                        branch: branch,
                        key: key,
                        type: type,
                        title: jsonData.title, // Title of the quiz/paper
                        index: index // The question's index in the file
                    });
                });
            }
        } catch (e) {
            console.error(`Failed to load/parse ${file} for search: ${e.message}`);
        }
    }
    
    searchCache.all = allQuestions;
    console.log(`Search cache built. ${allQuestions.length} questions indexed.`);
}

// The API Route
app.get('/api/search', (req, res) => {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
        return res.json([]);
    }

    if (!searchCache.all) {
        return res.status(503).json({ error: 'Search cache is building. Please try again in a moment.' });
    }
    
    const results = searchCache.all.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.explanation.toLowerCase().includes(query)
    );
    
    // Limit to 50 results to avoid overwhelming the client
    res.json(results.slice(0, 50));
});
// --- END OF NEW SEARCH ENDPOINT ---


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
    buildSearchCache(); // Build the cache when the server starts
});