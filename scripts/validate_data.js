const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');

// --- Define Schemas ---

// Schema for a single question
const questionSchema = Joi.object({
    question: Joi.string().required(),
    image: Joi.string().allow(null, ''),
    options: Joi.array().items(Joi.string()).min(2).required(),
    answer: Joi.string().required(),
    explanation: Joi.string().allow(null, '').optional(),
    chapter: Joi.string().required()
});

// Schema for a QUIZ file (e.g., fluid_mechanics.json, mechanical_2008.json)
const quizFileSchema = Joi.object({
    title: Joi.string().required(),
    chapters: Joi.array().items(Joi.string()).optional(), // Optional for year-wise
    questions: Joi.array().items(questionSchema).min(1).required()
});

// Schema for a LIST file (e.g., subjects.json, years.json)
const listFileSchema = Joi.array().items(
    Joi.object({
        key: Joi.string().required(),
        title: Joi.string().required()
    })
).min(1);

// Schema for a CONTENT file (e.g., aboutUs.json)
const contentFileSchema = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().optional(),
    sections: Joi.object().optional() // More complex, but good for now
});


// --- Helper Functions ---

async function validateFile(filePath, schema) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        const { error } = schema.validate(jsonData);
        
        if (error) {
            console.error(`\n❌ VALIDATION FAILED for ${filePath}`);
            console.error(error.details.map(d => `  - ${d.message}`).join('\n'));
            return false;
        }
        return true;
    } catch (e) {
        console.error(`\n❌ ERROR reading/parsing ${filePath}: ${e.message}`);
        return false;
    }
}

async function findAndValidateFiles(directory, schema) {
    let allValid = true;
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!await findAndValidateFiles(fullPath, schema)) {
                allValid = false;
            }
        } else if (entry.name.endsWith('.json')) {
            if (!await validateFile(fullPath, schema)) {
                allValid = false;
            }
        }
    }
    return allValid;
}

// --- Main Validation Function ---

async function main() {
    console.log('Starting validation...');
    let totalSuccess = true;

    const dataRoot = path.join(__dirname, '..', 'data');

    // 1. Validate Content Files
    console.log('\nValidating Content Files...');
    const contentDir = path.join(dataRoot, 'content');
    if (!await findAndValidateFiles(contentDir, contentFileSchema)) {
        totalSuccess = false;
    }

    // 2. Validate Quizzes (questions)
    console.log('\nValidating Quiz Files...');
    const quizzesDir = path.join(dataRoot, 'quizzes');
    // We must find all JSON files EXCEPT 'subjects.json'
    // This is a simplified check. We'll manually check the quiz files
    // (A more complex script would walk and check schemas by name)
    
    // For simplicity, let's just validate one known file as an example
    // TO-DO: Build a recursive walker that applies schemas based on filename
    console.log('Validating main quiz files (this is a sample check)...');
    const sampleQuizPath = path.join(quizzesDir, 'isro', 'mechanical', 'fluid_mechanics.json');
    if (await fs.access(sampleQuizPath).then(() => true).catch(() => false)) {
        if (!await validateFile(sampleQuizPath, quizFileSchema)) totalSuccess = false;
    } else {
        console.warn(`WARN: Could not find sample file ${sampleQuizPath} to test.`);
    }

    // 3. Validate Lists (subjects.json / years.json)
    console.log('\nValidating List Files (subjects/years)...');
    const sampleSubjectsPath = path.join(quizzesDir, 'isro', 'mechanical', 'subjects.json');
     if (await fs.access(sampleSubjectsPath).then(() => true).catch(() => false)) {
        if (!await validateFile(sampleSubjectsPath, listFileSchema)) totalSuccess = false;
    } else {
        console.warn(`WARN: Could not find sample file ${sampleSubjectsPath} to test.`);
    }

    const sampleYearsPath = path.join(dataRoot, 'yearWise', 'isro', 'mechanical', 'years.json');
     if (await fs.access(sampleYearsPath).then(() => true).catch(() => false)) {
        if (!await validateFile(sampleYearsPath, listFileSchema)) totalSuccess = false;
    } else {
        console.warn(`WARN: Could not find sample file ${sampleYearsPath} to test.`);
    }

    // --- Final Result ---
    if (totalSuccess) {
        console.log('\n\n✅ All checked files passed validation!');
    } else {
        console.error('\n\n❌ One or more files failed validation. Please check the errors above.');
        process.exit(1); // Exit with an error code
    }
}

main();
