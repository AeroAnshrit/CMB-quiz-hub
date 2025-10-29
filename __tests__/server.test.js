const request = require('supertest');
const { app, searchCache } = require('../server');

describe('Search API', () => {
  beforeAll(() => {
    // Manually set the search cache for all tests in this suite
    searchCache.all = [
      {
        question: 'This is a test question about Thermodynamics.',
        explanation: 'This is an explanation.',
        exam: 'isro',
        branch: 'mechanical',
        key: 'thermodynamics',
        type: 'topic',
        title: 'Thermodynamics',
        index: 0,
      },
    ];
  });

  test('should return case-insensitive search results', async () => {
    // Perform a search with a lowercase query
    const response = await request(app).get('/api/search?q=thermodynamics');

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].question).toBe('This is a test question about Thermodynamics.');
  });
});
