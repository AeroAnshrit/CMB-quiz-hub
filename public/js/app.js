import * as ui from './ui.js';
import * as quiz from './quiz.js';

/**
 * Manages the confirmation modal, including focus trapping and keyboard events.
 */
const ModalController = {
    lastFocusedElement: null,
    init() {
        ui.confirmModal.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    open() {
        this.lastFocusedElement = document.activeElement;
        ui.confirmModal.classList.remove('hidden');
        ui.confirmModal.classList.add('flex');
        ui.cancelSubmitBtn.focus();
        document.addEventListener('focus', this.trapFocus, true);
    },
    close() {
        ui.confirmModal.classList.add('hidden');
        ui.confirmModal.classList.remove('flex');
        document.removeEventListener('focus', this.trapFocus, true);
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            this.lastFocusedElement.focus();
        }
    },
    trapFocus(e) {
        if (!ui.confirmModal.contains(e.target)) {
            e.stopPropagation();
            ui.cancelSubmitBtn.focus();
        }
    },
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        }
        if (e.key === 'Tab') {
            const focusable = Array.from(ui.confirmModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const currentIndex = focusable.indexOf(document.activeElement);

            if (e.shiftKey && currentIndex === 0) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && currentIndex === focusable.length - 1) {
                e.preventDefault();
                first.focus();
            }
        }
    }
};

function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    const sunIcon = document.getElementById('theme-toggle-sun');
    const moonIcon = document.getElementById('theme-toggle-moon');

    function setTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }

    // Set initial icon state on page load
    const isDarkMode = document.documentElement.classList.contains('dark');
    setTheme(isDarkMode);

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        setTheme(!isCurrentlyDark);
    });
}

/**
 * Handles keyboard shortcuts for the quiz.
 */
function handleQuizKeydown(e) {
    // Step 1: Check if the quiz section is even visible. If not, do nothing.
    if (ui.sections.quiz.classList.contains('hidden')) {
        return;
    }

    // Step 2: Don't run shortcuts if the user is typing in a search box
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Step 3: Map keys to the button's position (0 = A, 1 = B, etc.)
    const key = e.key.toLowerCase();
    let buttonIndex = -1;

    if (key === 'a' || key === '1') {
        buttonIndex = 0;
    } else if (key === 'b' || key === '2') {
        buttonIndex = 1;
    } else if (key === 'c' || key === '3') {
        buttonIndex = 2;
    } else if (key === 'd' || key === '4') {
        buttonIndex = 3;
    }

    // Step 4: If the key was one we care about, find and click the button
    if (buttonIndex > -1) {
        // Find all the answer buttons currently on the page
        const optionButtons = ui.optionsContainer.querySelectorAll('button[data-action="select-answer"]');
        const targetButton = optionButtons[buttonIndex];

        // If the button exists and isn't disabled, click it!
        if (targetButton && !targetButton.disabled) {
            e.preventDefault(); // Stop the key from doing anything else
            targetButton.click();
        }
    }
}

/**
 * Centralized event handler for all click events, using delegation.
 */
function handleAppActions(e) {
    const target = e.target;
    const actionTarget = target.closest('[data-action]');

    if (!actionTarget) return;

    const { action, branch, contentKey, quizType, key, sectionKey, chapter, questionIndex, examKey } = actionTarget.dataset;

    switch (action) {
        case 'select-branch': {
            const quizBranches = ['mechanical', 'electrical', 'cs', 'civil', 'aptitude', 'maths'];
            const contentBranches = ['allAboutIsro', 'isroRecruitmentGuide', 'isroInterviewPrep'];
            if (quizBranches.includes(branch)) {
                quiz.setCurrentBranch(branch);
                ui.showQuizTypeSelection(branch);
            } else if (contentBranches.includes(branch)) {
                quiz.showContentPage(branch);
            }
            break;
        }
        case 'show-isro-section':
            quiz.renderContentSection(sectionKey);
            break;
        case 'select-quiz-type':
            // The quizType and examKey are on the button's dataset
            if (quizType && examKey) { // <-- check for both
                quiz.setCurrentExam(examKey); // <-- ADD THIS
                quiz.showDynamicList(quizType);
            }
            break;
        case 'select-dynamic-item': {
            const state = quiz.getState();
            if (state.currentQuizType === 'year') {
                const paper = { key, title: actionTarget.innerText };
                quiz.setCurrentPaper(paper);
                ui.showModeSelection(paper);
            } else { // 'topic'
                quiz.startTopicQuiz(key);
            }
            break;
        }
        case 'start-solution-mode':
            quiz.startYearWiseQuiz(false);
            break;
        case 'start-quiz-mode':
            quiz.startYearWiseQuiz(true);
            break;
        case 'back-to-papers':
            quiz.showDynamicList('year'); // This was correct, the issue was in the quiz.js file
            break;
        case 'go-home':
            ui.goToHome();
            break;
        case 'show-content-page':
            e.preventDefault();
            quiz.showContentPage(contentKey);
            break;
        case 'select-answer': {
            const state = quiz.getState();
            const question = state.currentQuestions[state.currentQuestionIndex];
            quiz.selectAnswer(actionTarget, actionTarget.innerText, question);
            break;
        }
        case 'next-question':
            quiz.nextQuestion();
            break;
        case 'open-submit-modal':
            ModalController.open();
            break;
        case 'cancel-submit':
            ModalController.close();
            break;
        case 'confirm-submit':
            ModalController.close();
            quiz.calculateAndShowScore();
            break;

            // ADD THIS NEW CASE
            case 'share-score':
                ui.copyScoreToClipboard();
                break;

        // --- ADD ALL OF THIS ---
        case 'open-end-quiz-modal':
            ui.showEndQuizModal();
            break;
        case 'cancel-end-quiz':
            ui.hideEndQuizModal();
            break;
        case 'confirm-end-quiz':
            ui.hideEndQuizModal();
            quiz.endQuizAndGoHome(); // New function in quiz.js
            break;
        case 'resume-confirm':
            ui.hideResumeModal();
            quiz.resumeQuiz(); // New function in quiz.js
            break;
        case 'resume-discard':
            ui.hideResumeModal();
            quiz.startNewQuiz(); // New function in quiz.js
            break;
        // --- END OF ADDED CODE ---
        case 'filter-by-chapter':
            quiz.filterQuestionsByChapter(chapter);
            break;
        // case 'show-search-page':
        //     ui.showSection('search');
        //     break;
        // case 'go-to-search-result':
        //     // The dataset from the result item has all the info
        //     quiz.jumpToQuestion(actionTarget.dataset); // New func in quiz.js
        //     break;
        case 'go-to-question':
            if (questionIndex) {
                const index = parseInt(questionIndex, 10);
                if (!isNaN(index)) quiz.goToQuestion(index);
            }
            break;
    }
}

// --- App Initialization ---
function init() {
    document.addEventListener('click', handleAppActions);
    document.addEventListener('keydown', handleQuizKeydown); // <-- ADD THIS LINE
    ModalController.init();
    setupThemeToggle();
    ui.goToHome();

    // ADD THIS LISTENER
    // We use 'input' to search as the user types
    const searchInput = document.getElementById('question-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            quiz.filterQuestionsByKeyword(e.target.value);
        });
    }
    // END OF ADDED CODE

    // --- ADD THIS NEW LISTENER ---
    // const globalSearchForm = document.getElementById('global-search-form');
    // if (globalSearchForm) {
    //     globalSearchForm.addEventListener('submit', async (e) => {
    //         e.preventDefault();
    //         const input = document.getElementById('global-search-input');
    //         const resultsContainer = document.getElementById('search-results-container');
            
    //         const term = input.value.trim();
    //         if (!term) return;

    //         resultsContainer.innerHTML = '<p class="text-gray-500 text-center">Searching...</p>';
    //         const results = await quiz.searchQuestions(term); // New func in quiz.js
    //         ui.displaySearchResults(results);
    //     });
    // }
}

// --- App Initialization ---
init(); // <--- ADD THIS LINE BACK

// One-time migration: remove old resume key once per user
try {
    if (window && window.localStorage) {
        const MIGRATED_FLAG = 'engineering_quiz_migrated_v1';
        const OLD_KEY = 'engineering_quiz_progress_v1';
        if (!localStorage.getItem(MIGRATED_FLAG)) {
            try { localStorage.removeItem(OLD_KEY); } catch (e) { /* ignore */ }
            try { localStorage.setItem(MIGRATED_FLAG, '1'); } catch (e) { /* ignore */ }
        }
    }
} catch (e) {
    // ignore; localStorage may be unavailable in some environments
}
// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Trigger deployment