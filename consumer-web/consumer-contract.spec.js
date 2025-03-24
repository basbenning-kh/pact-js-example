const path = require('path');
const { fetchMovies, fetchSingleMovie, addNewMovie, deleteMovie } = require('./consumer');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');

const {
    eachLike,
    integer,
    string
} = MatchersV3;

const provider = new PactV3({
  dir: path.resolve(process.cwd(), 'pacts'),
  consumer: 'WebConsumer',
  provider: 'MoviesAPI',
});

const EXPECTED_BODY = { id: 1, name: "My movie", year: 1999 }

describe('Movies Service', () => {
  describe('When a GET request is made to /movies', () => {
    test('it should return all movies', async () => {
      provider
        .uponReceiving('a request to all movies')
        .withRequest({
          method: 'GET',
          path: '/movies',
        })
        .willRespondWith({
          status: 200,
          body: eachLike(EXPECTED_BODY),
        });

      await provider.executeTest(async mockProvider => {
        const movies = await fetchMovies(mockProvider.url);
        expect(movies[0]).toEqual(EXPECTED_BODY);
      })
    });
  });

  describe('When a GET request is made to a specific movie ID', () => {
    test('it should return a specific movie', async () => {
      const EXPECTED_BODY = { id: 1, name: "My movie", year: 1999 }
      const testId = 100;
      EXPECTED_BODY.id = testId;

      provider
        .given('Has a movie with specific ID', { id: testId })
        .uponReceiving('a request to a specific movie')
        .withRequest({
          method: 'GET',
          path: `/movie/${testId}`,
        })
        .willRespondWith({
            status: 200,
            body: {
              id: integer(testId),
              name: string(EXPECTED_BODY.name),
              year: integer(EXPECTED_BODY.year)
            }
        });

      await provider.executeTest(async mockProvider => {
        const movies = await fetchSingleMovie(mockProvider.url, testId);
        expect(movies).toEqual(EXPECTED_BODY);
      });
    });
  });

  describe('When a POST request is sent to /movies', () => {
    test('it should create a new movie if it didn\'t already exist' , async () => {
      const EXPECTED_BODY = { id: 1, name: "My new movie", year: 1999 }
      provider
          .uponReceiving('a request to create a new movie')
          .withRequest({
            method: 'POST',
            path: '/movies',
            body: { name: EXPECTED_BODY.name, year: EXPECTED_BODY.year }
          })
          .willRespondWith({
            status: 201,
            body: {
                id: integer(EXPECTED_BODY.id),
                name: string(EXPECTED_BODY.name),
                year: integer(EXPECTED_BODY.year)
            }
          });
      await provider.executeTest(async mockProvider => {
        const response = await addNewMovie(mockProvider.url, EXPECTED_BODY.name, EXPECTED_BODY.year)
        expect(response).toEqual(EXPECTED_BODY);
      });
    });

    test('it should give an error if it already existed' , async () => {
      const BODY = { name: "Existing movie", year: 1999 };
      const EXPECTED_ERROR = { message: "Movie Existing movie already exists" };
      provider
          .given('Has a movie with specific name', { name: BODY.name })
          .uponReceiving('a request to create a new movie')
          .withRequest({
            method: 'POST',
            path: '/movies',
            body: BODY
          })
          .willRespondWith({
            status: 409,
            body: { message: string(EXPECTED_ERROR.message) }
          });
      await provider.executeTest(async mockProvider => {
        const response = await addNewMovie(mockProvider.url, BODY.name, BODY.year)
        expect(response).toEqual(EXPECTED_ERROR.message);
      });
    });
  });
  describe('When a DELETE request is sent to /movies', () => {
    test('it should return 404 if it didn\'t already exist', async () => {
      provider
        .uponReceiving('a request to delete a non-existing movie')
        .withRequest({
          method: 'DELETE',
          path: '/movie/100'
        })
        .willRespondWith({
          status: 404,
          body: {
            message: string('Movie 100 not found')
          }
        });
      await provider.executeTest(async mockProvider => {
        const response = await deleteMovie(mockProvider.url, 100);
        expect(response).toEqual('Movie 100 not found');
      });
    });

    test('it should return 200 if movie exists', async () => {
      provider
        .given('Has a movie with specific ID', { id: 100 })
        .uponReceiving('a request to delete an existing movie')
        .withRequest({
          method: 'DELETE',
          path: '/movie/100'
        })
        .willRespondWith({
          status: 200,
          body: {
            message: string('Movie 100 deleted')
          }
        });
      await provider.executeTest(async mockProvider => {
        const response = await deleteMovie(mockProvider.url, 100);
        expect(response).toEqual('Movie 100 deleted');
      });
    });
  });
});
