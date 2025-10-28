function calculateScore(questions = [], userAnswers = [], penalty = 1/3) {
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ans = userAnswers[i];
    if (ans === null || typeof ans === 'undefined') {
      unattempted++;
    } else if (ans === q.answer) {
      correct++;
    } else {
      incorrect++;
    }
  }
  const totalScore = (correct) - (incorrect * penalty);
  return { correct, incorrect, unattempted, totalScore };
}

module.exports = { calculateScore };
