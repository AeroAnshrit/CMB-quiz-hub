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

export async function getSubjects(exam, branch) {
    return await fetchData(`/data/quizzes/${exam}/${branch}/subjects.json`, 'Could not load subjects');
}

export async function getYears(exam, branch) {
    return await fetchData(`/data/yearWise/${exam}/${branch}/years.json`, 'Could not load papers');
}

export async function getContent(pageKey) {
    return await fetchData(`/data/content/${pageKey}.json`, 'Could not load content');
}

export async function getQuizData(exam, branch, subjectKey) {
    return await fetchData(`/data/quizzes/${exam}/${branch}/${subjectKey}.json`, 'Could not load quiz data');
}

// --- ADD THIS MISSING FUNCTION HERE ---
export async function getYearWiseQuizData(exam, branch, yearKey) {
    return await fetchData(`/data/yearWise/${exam}/${branch}/${yearKey}.json`, 'Could not load year-wise quiz data');
}
// -------------------------------------

// export async function searchAllQuestions(query) {
//     return await fetchData(`/api/search?q=${encodeURIComponent(query)}`, 'Could not perform search');
// }