const { calculateScore } = require('../public/js/score.cjs');

describe('calculateScore', () => {
  const questions = [
    { answer: 'A' },
    { answer: 'B' },
    { answer: 'C' },
    { answer: 'D' }
  ];

  test('all correct', () => {
    const userAnswers = ['A','B','C','D'];
    const result = calculateScore(questions, userAnswers);
    expect(result.correct).toBe(4);
    expect(result.incorrect).toBe(0);
    expect(result.unattempted).toBe(0);
    expect(result.totalScore).toBeCloseTo(4.00);
  });

  test('incorrect and penalty', () => {
    const userAnswers = ['A','X','Y','D'];
    const result = calculateScore(questions, userAnswers);
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(2);
    expect(result.totalScore).toBeCloseTo(2 - (2*(1/3)));
  });

  test('unattempted handling', () => {
    const userAnswers = ['A', null, 'C', null];
    const result = calculateScore(questions, userAnswers);
    expect(result.correct).toBe(2);
    expect(result.unattempted).toBe(2);
    expect(result.incorrect).toBe(0);
    expect(result.totalScore).toBeCloseTo(2.00);
  });
});
