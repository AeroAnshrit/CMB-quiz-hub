import { displayError, showLoadingIndicator, hideLoadingIndicator } from './ui.js';

/**
 * The main fetch function.
 * NOTE: This function is unchanged.
 */
async function fetchData(url, errorMessage) {
    showLoadingIndicator();
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
            throw new Error(errorData.error || 'Failed to fetch data');
        }
        return await response.json();
    } catch (error) {
        // Log the specific URL that failed
        console.error(`Failed to fetch ${url}. Error: ${error.message}`);
        displayError(`${errorMessage}: ${error.message}`);
        return null;
    } finally {
        hideLoadingIndicator();
    }
}
// --- STATIC FETCHES ---
/**
 * Fetches the list of subjects.
 * Assumes you have a 'subjects.json' file in your root 'docs' folder.
 * This file is filtered client-side by exam and branch.
 */
export async function getSubjects(exam, branch) {
    // Fetch a single static subjects.json file
    const allSubjectsData = await fetchData('./subjects.json', 'Could not load subjects');
    
    // Filter in the browser
    if (allSubjectsData && allSubjectsData[exam] && allSubjectsData[exam][branch]) {
        return allSubjectsData[exam][branch];
    } else if (allSubjectsData) {
        console.error(`No subject data found in subjects.json for exam: ${exam}, branch: ${branch}`);
        return [];
    }
    return null;
}

/**
 * Fetches the list of years.
 * This is the fix I provided earlier, assuming 'years.json' is in your root 'docs' folder.
 */
export async function getYears(exam, branch) {
    // Fetch the ONE static JSON file
    const allYearsData = await fetchData('./years.json', 'Could not load papers');

    // Filter in the browser
    if (allYearsData && allYearsData[exam] && allYearsData[exam][branch]) {
        return allYearsData[exam][branch];
    } else if (allYearsData) {
        console.error(`No data found in years.json for exam: ${exam}, branch: ${branch}`);
        return []; // Return empty array
    }
    
    return null; // Return null if allYearsData itself failed to load
}

/**
 * Fetches static content pages (like 'About Us').
 * Assumes you have a 'content.json' file in your root 'docs' folder.
 */
export async function getContent(pageKey) {
    // Fetch a single static content.json file
    const allContentData = await fetchData('./content.json', 'Could not load content');

    // Filter in the browser
    if (allContentData && allContentData[pageKey]) {
        return allContentData[pageKey];
    } else if (allContentData) {
        console.error(`No content data found in content.json for key: ${pageKey}`);
        return { title: "Not Found", body: "Content could not be loaded." };
    }
    return null;
}

/**
 * Fetches a specific topic-wise quiz file.
 * This now constructs a path to a specific JSON file inside your 'data' folder.
 */
export async function getQuizData(exam, branch, subjectKey) {
    const url = `./data/${exam}/${branch}/topic/${subjectKey}.json`;
    return await fetchData(url, 'Could not load quiz data');
}

/**
 * Fetches a specific year-wise quiz file.
 * This now constructs a path to a specific JSON file inside your 'data' folder.
 */
export async function getYearWiseQuizData(exam, branch, yearKey) {
    const url = `./data/${exam}/${branch}/year/${yearKey}.json`;
    return await fetchData(url, 'Could not load year-wise quiz data');
}
