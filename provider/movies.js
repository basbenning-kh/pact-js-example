class Movie {
  constructor() {
    this.movies = [];
  }

  getMovies() {
    return this.movies;
  }

  getMovieById(id) {
    return this.movies.find((movie) => parseInt(id) == movie.id);
  }

  getMovieByName(name) {
    return this.movies.find(movie => movie.name === name)
  }

  insertMovie(movie) {
    this.movies.push(movie);
  }

  deleteMovie(movie) {
    const index = this.movies.indexOf(movie);
    this.movies.splice(index, 1);
  }

  getFirstMovie() {
    return this.movies[0];
  }

  getLastMovie() {
    return this.movies[this.movies.length - 1];
  }
}

module.exports = Movie;