// This variable holds the chart instance so we can destroy it
let scoreChartInstance = null;
// This holds the message for the share button
let currentShareMessage = '';

// --- DOM Elements ---
export const sections = {
    home: document.getElementById('home-section'),
    subjects: document.getElementById('subjects-section'),
    quiz: document.getElementById('quiz-section'),
    score: document.getElementById('score-section'),
    content: document.getElementById('content-section'),
    quizType: document.getElementById('quiz-type-section'),
    modeSelection: document.getElementById('mode-selection-section'),
};
export const contentTitle = document.getElementById('content-title');
export const contentBody = document.getElementById('content-body');
export const subjectsTitle = document.getElementById('subjects-title');
export const subjectsContainer = document.getElementById('subjects-container');
export const chaptersSidebar = document.getElementById('chapters-sidebar');
export const quizTypeTitle = document.getElementById('quiz-type-title');
export const quizTypeContainer = document.getElementById('quiz-type-container');
export const quizTitle = document.getElementById('quiz-title');
export const questionImage = document.getElementById('question-image');
export const questionText = document.getElementById('question-text');
export const optionsContainer = document.getElementById('options-container');
export const explanationContainer = document.getElementById('explanation-container');
export const progressText = document.getElementById('progress-text');
export const skipBtn = document.getElementById('skip-btn');
export const nextBtn = document.getElementById('next-btn');
export const submitBtn = document.getElementById('submit-btn');
export const confirmModal = document.getElementById('confirm-modal');
export const endQuizModal = document.getElementById('end-quiz-modal');
export const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
export const cancelSubmitBtn = document.getElementById('cancel-submit-btn');
export const scoreText = document.getElementById('score-text');
export const chaptersContainer = document.getElementById('chapters-container');
export const homeContainer = document.getElementById('home-section');
export const modeSelectionTitle = document.getElementById('mode-selection-title');
export const errorContainer = document.getElementById('error-container');
export const loadingIndicator = document.getElementById('loading-indicator');
export const copyFeedback = document.getElementById('copy-feedback');
export const quizTimer = document.getElementById('quiz-timer');

// --- UI Functions ---

export function showLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

export function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

export function displayError(message) {
    if (errorContainer) {
        errorContainer.textContent = `An error occurred: ${message}`;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }
}

export function clearError() {
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
}

export function showSection(sectionName) {
    clearError();
    const mainContainer = document.querySelector('main');
    if (sectionName === 'quiz') {
        mainContainer.classList.remove('max-w-7xl');
        mainContainer.classList.add('max-w-full', 'px-4');
    } else {
        mainContainer.classList.add('max-w-7xl');
        mainContainer.classList.remove('max-w-full', 'px-4');
    }

    Object.values(sections).forEach(section => {
        if (section) section.classList.add('hidden');
    });
    if (sections[sectionName]) {
        sections[sectionName].classList.remove('hidden');
    }
}

export function goToHome() {
    showSection('home');
}

export function showModeSelection(paper) {
    modeSelectionTitle.innerText = `Select Mode for "${paper.title}"`;
    showSection('modeSelection');
}

export function showQuizTypeSelection(branch) {
    const branchTitle = branch.charAt(0).toUpperCase() + branch.slice(1);
    quizTypeTitle.innerText = `Select Quiz Type for ${branchTitle}`;
    quizTypeContainer.innerHTML = '';

    const examTypes = [
        { title: 'ISRO ICRB', key: 'isro', types: [{ key: 'topic', text: 'Topic-wise Questions' }, { key: 'year', text: 'Year-wise Papers (PYQ)' }] },
        { title: 'GATE', key: 'gate', types: [{ key: 'topic', text: 'Topic-wise Questions' }, { key: 'year', text: 'Year-wise Papers (PYQ)' }] },
        { title: 'ESE', key: 'ese', types: [{ key: 'topic', text: 'Topic-wise Questions' }, { key: 'year', text: 'Year-wise Papers (PYQ)' }] }
    ];

    examTypes.forEach(exam => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'bg-gray-50 p-6 rounded-lg shadow-md flex flex-col space-y-4';
        const columnTitle = document.createElement('h3');
        columnTitle.className = 'text-xl font-bold text-center text-gray-800 border-b-2 border-gray-200 pb-2';
        columnTitle.innerText = exam.title;
        columnDiv.appendChild(columnTitle);
        exam.types.forEach(type => {
            const button = document.createElement('button');
            button.innerText = type.text;
            button.type = 'button';
            button.setAttribute('aria-label', type.text);
            button.dataset.action = 'select-quiz-type';
            button.dataset.quizType = type.key;
            button.dataset.examKey = exam.key;
            
            if (exam.key === 'isro') {
                button.className = 'w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-teal-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white';
            } else {
                button.innerText += ' (Coming Soon)';
                button.className = 'w-full bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg cursor-not-allowed';
                button.disabled = true;
            }
            columnDiv.appendChild(button);
        });
        quizTypeContainer.appendChild(columnDiv);
    });
    showSection('quizType');
}

export function displayDynamicList(items, branch, type, onBack) {
    const isYearType = type === 'year';
    subjectsTitle.innerText = isYearType ? 'Select Year-wise Paper' : `Select Subject for ${branch}`;
    subjectsContainer.innerHTML = '';
    showSection('subjects');

    const backButton = document.createElement('button');
    backButton.innerText = '← Back to Quiz Types';
    backButton.type = 'button';
    backButton.className = 'w-full bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 mb-4 dark:bg-gray-700 dark:hover:bg-gray-600';
    backButton.onclick = onBack;
    subjectsContainer.appendChild(backButton);

    if (!items || items.length === 0) {
        const noItems = document.createElement('p');
        noItems.className = 'text-gray-500';
        noItems.textContent = `No ${isYearType ? 'papers' : 'subjects'} available for this branch yet.`;
        subjectsContainer.appendChild(noItems);
        return;
    }

    items.forEach(item => {
        const button = document.createElement('button');
        button.innerText = item.title;
        button.dataset.key = item.key;
        button.dataset.action = 'select-dynamic-item';
        button.dataset.branch = branch;
        button.type = 'button';
        button.setAttribute('aria-label', item.title);
        if (isYearType) {
            button.className = 'w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 dynamic-item-btn dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white';
        } else {
            button.className = 'w-full bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-600 dynamic-item-btn';
        }
        subjectsContainer.appendChild(button);
    });
}

export function renderContentPage(data) {
    if (!data) {
        contentTitle.textContent = 'Error';
        contentBody.textContent = '';
        const err = document.createElement('p');
        err.className = 'text-red-500';
        err.textContent = 'Could not load content.';
        contentBody.appendChild(err);
        showSection('content');
        return;
    }
    if (data.sections) {
        renderContentSection(data, 'main');
    } else {
        contentTitle.textContent = data.title;
        contentBody.innerHTML = data.body || '';
    }
    showSection('content');
}

export function renderContentSection(currentContentData, sectionKey) {
    const sectionData = currentContentData?.sections?.[sectionKey];
    if (sectionData) {
        contentTitle.textContent = sectionData.title;
        contentBody.innerHTML = sectionData.html || '';
    }
}

export function resetQuizUI(title = 'Loading Quiz...') {
    showSection('quiz');
    quizTitle.innerText = title;
    questionText.textContent = '';
    optionsContainer.textContent = '';
    explanationContainer.classList.add('hidden');
    questionImage.classList.add('hidden');
    progressText.innerText = '';
    nextBtn.disabled = true;
    skipBtn.disabled = true;
}

export function populateChapters(chapters, allQuizQuestions) {
    chaptersContainer.innerHTML = '';
    if (!chapters || chapters.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'No chapters defined.';
        chaptersContainer.appendChild(p);
        return;
    }
    const chapterCounts = (allQuizQuestions || []).reduce((acc, q) => {
        acc[q.chapter] = (acc[q.chapter] || 0) + 1;
        return acc;
    }, {});
    const allLink = document.createElement('p');
    allLink.className = 'chapter-link active-chapter';
    allLink.dataset.action = 'filter-by-chapter';
    allLink.dataset.chapter = 'All';
    const allText = document.createTextNode('All Chapters ');
    const allSpan = document.createElement('span');
    allSpan.className = 'chapter-count';
    allSpan.textContent = `(${(allQuizQuestions || []).length})`;
    allLink.appendChild(allText);
    allLink.appendChild(allSpan);
    chaptersContainer.appendChild(allLink);
    chapters.forEach(chapter => {
        const chapterLink = document.createElement('p');
        const count = chapterCounts[chapter] || 0;
        chapterLink.className = 'chapter-link text-gray-600';
        chapterLink.dataset.chapter = chapter;
        chapterLink.dataset.action = 'filter-by-chapter';
        const chapText = document.createTextNode(`${chapter} `);
        const chapSpan = document.createElement('span');
        chapSpan.className = 'chapter-count';
        chapSpan.textContent = `(${count})`;
        chapterLink.appendChild(chapText);
        chapterLink.appendChild(chapSpan);
        chaptersContainer.appendChild(chapterLink);
    });
}

export function updateChapterSelection(chapter) {
    document.querySelectorAll('#chapters-container .chapter-link').forEach(link => {
        link.classList.toggle('active-chapter', link.dataset.chapter === chapter);
    });
}

export function displayQuestion(question, currentIndex, totalQuestions, isQuizMode, userAnswers, onAnswerSelect) {
    const oldChapterName = document.querySelector('.chapter-name-display');
    if (oldChapterName) oldChapterName.remove();

    if (!question) {
        questionText.textContent = 'No questions available. Please select another chapter.';
        optionsContainer.textContent = '';
        questionImage.classList.add('hidden');
        explanationContainer.classList.add('hidden');
        progressText.innerText = '0 of 0';
        nextBtn.disabled = true;
        skipBtn.disabled = true;
        return;
    }

    questionImage.classList.toggle('hidden', !question.image);
    if (question.image) {
        questionImage.src = question.image;
        questionImage.setAttribute('loading', 'lazy');
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    const chapterName = document.createElement('p');
    chapterName.className = 'text-sm text-gray-500 mb-2 font-semibold chapter-name-display';
    chapterName.textContent = question.chapter || 'General';
    questionText.before(chapterName);

    questionText.innerText = `${currentIndex + 1}. ${question.question}`;
    optionsContainer.innerHTML = '';
    explanationContainer.classList.add('hidden');

    const options = [...(question.options || [])];

    options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.type = 'button';
        button.dataset.action = 'select-answer';
        button.setAttribute('aria-label', `Option: ${option}`);
        button.className = 'w-full text-left p-4 rounded-lg border border-gray-300 hover:bg-gray-100 option-btn';

        if (isQuizMode && userAnswers[currentIndex] === option) {
            button.classList.add('option-selected', 'dark:bg-indigo-700', 'dark:border-indigo-500', 'dark:text-white');
        }

        optionsContainer.appendChild(button);
    });
    progressText.innerText = `Question ${currentIndex + 1} of ${totalQuestions}`;
    nextBtn.disabled = true;
    skipBtn.disabled = false;

    if (isQuizMode) {
        nextBtn.disabled = false;
    }
    updateQuestionNav(currentIndex, userAnswers);
}

export function updateQuestionNav(currentIndex, userAnswers) {
    document.querySelectorAll('.question-nav-item').forEach(item => {
        const index = parseInt(item.dataset.questionIndex);
        item.classList.toggle('active-q-nav', index === currentIndex);
        item.classList.toggle('q-nav-answered', userAnswers[index] !== null);
    });
}

export function showAnswerFeedback(selectedButton, selectedOption, question) {
    const optionButtons = optionsContainer.querySelectorAll('button');
    optionButtons.forEach(btn => btn.disabled = true);
    skipBtn.disabled = true;

    if (selectedOption === question.answer) {
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('incorrect');
        optionButtons.forEach(btn => { if (btn.innerText === question.answer) btn.classList.add('correct'); });
    }
    if (question.explanation) {
        explanationContainer.innerHTML = ''; 
        const explanationHeading = document.createElement('p');
        explanationHeading.className = 'font-bold';
        explanationHeading.textContent = 'Explanation:';
        const explanationText = document.createElement('p');
        explanationText.textContent = question.explanation;
        explanationContainer.appendChild(explanationHeading);
        explanationContainer.appendChild(explanationText);
        explanationContainer.classList.remove('hidden');
    }
    nextBtn.disabled = false;
}

export function showSimpleScore(score, totalQuestions) {
    showSection('score');
    scoreText.innerText = `Your final score: ${score} / ${totalQuestions}`;
}

export function showFinalScore(correct, incorrect, unattempted, totalQuestions, quizTitle) {
    const totalScore = (correct * 1) - (incorrect * (1 / 3));

    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('incorrect-answers').textContent = incorrect;
    document.getElementById('unattempted-answers').textContent = unattempted;
    document.getElementById('total-score').textContent = totalScore.toFixed(2);

    scoreText.innerText = `You attempted ${correct + incorrect} out of ${totalQuestions} questions.`;

    // Build the share message and store it
    const siteTitle = "CMB Quiz Hub"; // Or pull from document.title
    currentShareMessage = `I scored ${totalScore.toFixed(2)} (${correct}/${totalQuestions}) on the "${quizTitle}" quiz at ${siteTitle}! Can you beat my score?`;
    
    // Hide the "Copied!" feedback in case it was open
    if (copyFeedback) copyFeedback.classList.add('hidden');

    showSection('score');
}

export function showEndQuizModal() {
    if (endQuizModal) endQuizModal.classList.remove('hidden');
}

export function hideEndQuizModal() {
    if (endQuizModal) endQuizModal.classList.add('hidden');
}

export function copyScoreToClipboard() {
    if (!navigator.clipboard) {
        alert("Clipboard not available. Please copy manually.");
        return;
    }

    navigator.clipboard.writeText(currentShareMessage).then(() => {
        if (copyFeedback) {
            copyFeedback.classList.remove('hidden');
            setTimeout(() => {
                copyFeedback.classList.add('hidden');
            }, 2000); 
        }
    }).catch(err => {
        console.error('Failed to copy score: ', err);
        alert('Could not copy score. Please try again.');
    });
}

export function displayScoreChart(correct, incorrect, unattempted) {
    // First, check if a chart already exists and destroy it
    if (scoreChartInstance) {
        scoreChartInstance.destroy();
    }

    const ctx = document.getElementById('score-chart').getContext('2d');
    
    // Get the current text color for dark mode compatibility
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';

    scoreChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Correct', 'Incorrect', 'Unattempted'],
            datasets: [{
                label: 'Quiz Results',
                data: [correct, incorrect, unattempted],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',  // Green
                    'rgba(239, 68, 68, 0.8)',   // Red
                    'rgba(107, 114, 128, 0.8)' // Gray
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(107, 114, 128, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor // Set legend text color
                    }
                },
                tooltip: {
                    bodyColor: textColor,
                    titleColor: textColor
                }
            }
        }
    });
}

export function updateTimerDisplay(minutes, seconds) {
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');
    quizTimer.textContent = `${minStr}:${secStr}`;
    quizTimer.classList.remove('hidden');
}

export function hideTimerDisplay() {
    quizTimer.classList.add('hidden');
}