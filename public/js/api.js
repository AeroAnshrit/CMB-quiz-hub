import { displayError, showLoadingIndicator, hideLoadingIndicator } from './ui.js';

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
        displayError(`${errorMessage}: ${error.message}`);
        return null;
    } finally {
        hideLoadingIndicator();
    }
}

// --- REVERT THESE PATHS ---
export async function getSubjects(exam, branch) {
    return await fetchData(`/api/subjects/${exam}/${branch}`, 'Could not load subjects');
}

export async function getYears(exam, branch) {
    return await fetchData(`/api/years/${exam}/${branch}`, 'Could not load papers');
}

export async function getContent(pageKey) {
    return await fetchData(`/api/content/${pageKey}`, 'Could not load content');
}

export async function getQuizData(exam, branch, subjectKey) {
    return await fetchData(`/api/quiz/${exam}/${branch}/${subjectKey}`, 'Could not load quiz data');
}

export async function getYearWiseQuizData(exam, branch, yearKey) {
    return await fetchData(`/api/year-wise/${exam}/${branch}/${yearKey}`, 'Could not load year-wise quiz data');
}
// --- END OF REVERTED PATHS ---

// Keep search commented out for now
// export async function searchAllQuestions(query) {
//   return await fetchData(`/api/search?q=${encodeURIComponent(query)}`, 'Could not perform search');
// }