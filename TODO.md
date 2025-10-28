# TODO: Add Share Score Button Feature

## Step 1: Add the "Share" Button to `index.html` ✅
- Open `public/Index.html`
- Find the `score-section` (around line 220)
- Locate the "Try Another Quiz" button
- Add the share button and feedback message before the "Try Another Quiz" button

## Step 2: Update `ui.js` to Handle the Logic ✅
- Add `let currentShareMessage = '';` at the top of `public/js/ui.js`
- Add `export const copyFeedback = document.getElementById('copy-feedback');` to the DOM elements section
- Change `showFinalScore` function signature to accept `quizTitle`
- Add logic to build share message and store it in `showFinalScore`
- Add `copyScoreToClipboard` function at the bottom

## Step 3: Update `quiz.js` to Pass the Title ✅
- Open `public/js/quiz.js`
- Find `calculateAndShowScore()` function
- Add line to get `quizTitle` from `ui.quizTitle.innerText`
- Update the `ui.showFinalScore` call to include `quizTitle`

## Step 4: Add the Click Handler in `app.js` ✅
- Open `public/js/app.js`
- Find the `handleAppActions` switch statement
- Add new case for 'share-score' action

## Testing
- Restart the server
- Do a hard reload (Ctrl + Shift + R)
- Complete a quiz and test the Share Score button
