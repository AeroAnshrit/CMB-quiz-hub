import * as api from './api.js';
import * as ui from './ui.js';

// --- State ---
const state = {
    allQuizQuestions: [],
    currentQuestions: [],
    currentQuestionIndex: 0,
    score: 0,
    currentChapter: 'All',
    currentBranch: null,
    currentSubjectKey: null,
    currentContentData: null,
    isQuizMode: false,
    userAnswers: [],
    currentPaper: null,
    currentExam: null,
    quizTimer: null, // Holds the setInterval instance
    timeLimitMinutes: 60 // Default time limit for quiz mode
};

// STORAGE_KEY removed; resume/persistence feature disabled

// --- Exported Functions ---
export function getState() {
    return state;
}

export function setCurrentBranch(branch) {
    state.currentBranch = branch;
}

export function setCurrentPaper(paper) {
    state.currentPaper = paper;
}

export function setCurrentExam(examKey) {
    state.currentExam = examKey;
}

export async function showDynamicList(type) {
    ui.resetQuizUI();
    const items = type === 'year' 
        ? await api.getYears(state.currentExam, state.currentBranch) 
        : await api.getSubjects(state.currentExam, state.currentBranch);
    if (items) {
        ui.displayDynamicList(items, state.currentBranch, type, () => ui.showQuizTypeSelection(state.currentBranch));
    }
}

export async function showContentPage(pageKey) {
    const data = await api.getContent(pageKey);
    if (data) {
        state.currentContentData = data;
        ui.renderContentPage(data);
    }
}

export function renderContentSection(sectionKey) {
    ui.renderContentSection(state.currentContentData, sectionKey);
}

export async function startYearWiseQuiz(isQuizMode, options = {}) {
    state.isQuizMode = isQuizMode;

    // Store the logic for starting a fresh quiz
        state.userAnswers = [];
        ui.resetQuizUI();

        if (isQuizMode) {
            ui.submitBtn.classList.remove('hidden');
            ui.nextBtn.classList.remove('hidden');
            ui.skipBtn.classList.remove('hidden');
        } else {
            ui.submitBtn.classList.add('hidden');
            ui.nextBtn.classList.remove('hidden');
            ui.skipBtn.classList.remove('hidden');
        }

        if (isQuizMode) {
            startTimer();
        } else {
            stopTimer();
        }

        const yearData = await api.getYearWiseQuizData(state.currentExam, state.currentBranch, state.currentPaper.key);
        if (!yearData) {
            ui.resetQuizUI('Error');
            ui.questionText.textContent = 'Could not load this paper. Please try again.';
            return;
        }

        state.allQuizQuestions = yearData.questions;
        state.userAnswers = new Array(state.allQuizQuestions.length).fill(null);
        state.score = 0;

        setupYearWiseUI(yearData.title); // Call new UI function
        if (options.jumpToIndex !== undefined) {
            state.currentQuestions = state.allQuizQuestions; // Use all questions
            state.currentQuestionIndex = options.jumpToIndex;
            ui.updateChapterSelection('All');
            showQuestion(); // Jump straight to the question
        } else {
            filterQuestionsByChapter('All'); // Default behavior
        }
}

export async function startTopicQuiz(subjectKey, options = {}) {
    state.currentSubjectKey = subjectKey;
    state.isQuizMode = false; // Topic mode is always solution mode
        ui.resetQuizUI();
        ui.submitBtn.classList.add('hidden');
        ui.nextBtn.classList.remove('hidden');
        ui.skipBtn.classList.remove('hidden');

        const subjectData = await api.getQuizData(state.currentExam, state.currentBranch, subjectKey);
        if (!subjectData) {
            ui.resetQuizUI('Error');
            ui.questionText.textContent = 'Could not load quiz. Please try again.';
            return;
        }

        state.allQuizQuestions = subjectData.questions;
        state.score = 0; // Always reset score for topic mode
        state.userAnswers = []; // And answers

        setupTopicQuizUI(subjectData.title, subjectData.chapters); // Call new UI func
        if (options.jumpToIndex !== undefined) {
            state.currentQuestions = state.allQuizQuestions; // Use all questions
            state.currentQuestionIndex = options.jumpToIndex;
            ui.updateChapterSelection('All');
            showQuestion(); // Jump straight to the question
        } else {
            filterQuestionsByChapter('All'); // Default behavior
        }
}

function applyFilters() {
    let questionsToDisplay = [...(state.allQuizQuestions || [])];

    // 1. Apply Chapter Filter
    if (state.currentChapter !== 'All') {
        questionsToDisplay = questionsToDisplay.filter(q => q.chapter === state.currentChapter);
    }

    // 3. Apply Randomization (if in Quiz Mode)
    // Only randomize questions for quiz (exam) mode. In solution/view mode keep original order.
    // NOTE: This randomization will happen every time you type, which might be jarring.
    // An alternative is to *only* shuffle when the quiz first loads.
    if (state.isQuizMode) {
        shuffleArray(questionsToDisplay); // We keep this as you had it
    }

    state.currentQuestions = questionsToDisplay;
    state.currentQuestionIndex = 0;
    showQuestion();
}

export function filterQuestionsByChapter(chapter) {
    state.currentChapter = chapter;
    ui.updateChapterSelection(chapter);
    applyFilters(); // <-- Call the new master function
}

export function goToQuestion(index) {
    state.currentQuestionIndex = index;
    showQuestion();
}

export function selectAnswer(selectedButton, selectedOption, question) {
    if (state.isQuizMode) {
        state.userAnswers[state.currentQuestionIndex] = selectedOption;
        // remove selection classes (including dark-mode utility classes) from all option buttons
        ui.optionsContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('option-selected', 'dark:bg-indigo-700', 'dark:border-indigo-500', 'dark:text-white'));
        // add selected classes including dark-mode indigo utilities
        selectedButton.classList.add('option-selected', 'dark:bg-indigo-700', 'dark:border-indigo-500', 'dark:text-white');
        ui.updateQuestionNav(state.currentQuestionIndex, state.userAnswers);
    } else {
        if (selectedOption === question.answer) {
            state.score++;
        }
        ui.showAnswerFeedback(selectedButton, selectedOption, question);
    }
}

export function nextQuestion() {
    if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
        state.currentQuestionIndex++;
        showQuestion();
    } else if (state.isQuizMode) {
        alert('You are at the last question. Click Submit to see your score.');
    } else {
        ui.showSimpleScore(state.score, state.currentQuestions.length);
    }
}

export function calculateAndShowScore() {
    stopTimer(); // <-- ADD THIS
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    state.allQuizQuestions.forEach((question, index) => {
        const userAnswer = state.userAnswers[index];
        if (userAnswer === null) {
            unattempted++;
        } else if (userAnswer === question.answer) {
            correct++;
        } else {
            incorrect++;
        }
    });

    // ADD THIS LINE
    const quizTitle = ui.quizTitle.innerText;

    // Now, update the function call below to include quizTitle
    ui.showFinalScore(correct, incorrect, unattempted, state.allQuizQuestions.length, quizTitle);
    ui.displayScoreChart(correct, incorrect, unattempted); // <-- ADD THIS LINE
}


// --- Helper Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTimer() {
    let timeLeft = state.timeLimitMinutes * 60; // Seconds

    // Initial display update
    ui.updateTimerDisplay(state.timeLimitMinutes, 0);
    
    // Clear any existing timer
    if (state.quizTimer) clearInterval(state.quizTimer);

    state.quizTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        ui.updateTimerDisplay(minutes, seconds);

        if (timeLeft <= 0) {
            clearInterval(state.quizTimer);
            alert('Time is up! Submitting quiz.');
            calculateAndShowScore(); // Automatically submit
        }
    }, 1000);
}

function stopTimer() {
    if (state.quizTimer) {
        clearInterval(state.quizTimer);
        state.quizTimer = null;
    }
    ui.hideTimerDisplay();
}

function setupYearWiseUI(title) {
    ui.quizTitle.innerText = title;
    ui.chaptersSidebar.classList.remove('hidden');
    ui.chaptersContainer.textContent = '';
    const navGrid = document.createElement('div');
    navGrid.className = 'question-nav-grid';

    const questionCount = state.allQuizQuestions.length > 0 ? state.allQuizQuestions.length : 80;
    const hasQuestions = state.allQuizQuestions.length > 0;

    for (let i = 0; i < questionCount; i++) {
        const navItem = document.createElement('div');
        navItem.textContent = i + 1;
        navItem.className = 'question-nav-item';
        if (hasQuestions) {
            navItem.dataset.questionIndex = i;
            navItem.dataset.action = 'go-to-question'; // Add action!
        } else {
            navItem.style.cursor = 'not-allowed';
            navItem.style.color = '#9ca3af';
        }
        navGrid.appendChild(navItem);
    }
    ui.chaptersContainer.appendChild(navGrid);

    ui.showSection('quiz'); // Show section *after* setup
}

function setupTopicQuizUI(title, chapters) {
    ui.quizTitle.innerText = title;
    ui.chaptersSidebar.classList.remove('hidden');
    ui.populateChapters(chapters, state.allQuizQuestions);
    ui.showSection('quiz'); // Show section *after* setup
}

export function endQuizAndGoHome() {
    stopTimer(); // <-- ADD THIS
    ui.goToHome();
}

function showQuestion() {
    const question = state.currentQuestions[state.currentQuestionIndex];
    ui.displayQuestion(
        question,
        state.currentQuestionIndex,
        state.currentQuestions.length,
        state.isQuizMode,
        state.userAnswers,
        selectAnswer
    );
}
