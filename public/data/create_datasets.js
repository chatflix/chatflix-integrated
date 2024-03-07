// generates simplified datasets of popular movies in each genre as well as currently trending sotrts
// installation: npm install axios fs path
// running: node create_datasets.js

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const apiKey = '829a43a98259bc44cae297489c7e3bba';
const baseUrl = 'https://api.themoviedb.org/3';
const genresUrl = `${baseUrl}/genre/movie/list?api_key=${apiKey}&language=en-US`;
let genresMapping = {}

async function getGenres() {
  try {
    const response = await axios.get(genresUrl);
    console.log(JSON.stringify(response.data.genres, null, 2))
    return response.data.genres; // Assuming genres are in response.data.genres
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    return [];
  }
}

async function fetchDataByQuery(queryType, genreId = '') {
    const endpoints = genreId ? ['popular', 'top_rated'] : ['popular', 'trending/week', 'upcoming', 'top_rated'];
    const results = [];
  
    for (const endpoint of endpoints) {
      for (let page = 1; page <= 5; page++) {
        const url = genreId 
          ? `${baseUrl}/discover/movie?api_key=${apiKey}&sort_by=popularity.desc&include_adult=false&page=${page}&with_genres=${genreId}`
          : `${baseUrl}/${endpoint === 'trending/week' ? 'trending/movie/week' : `movie/${endpoint}`}?api_key=${apiKey}&page=${page}`;
        
        console.log(`Fetching ${endpoint} ${genreId ? `for genre ${genreId}` : ''} - Page ${page}`);
        try {
          const response = await axios.get(url);
        //   const simplified = response.data.results.map(movie => ({
        //     title: movie.title,
        //     description: movie.overview,
        //     genres: movie.genre_ids, // This will need mapping to genre names based on the initial genre fetch
        //     language: movie.original_language,
        //     // Starring, budget, popularity, parental rating, and recommendations might not be directly available or complete
        //     poster: movie.poster_path,
        //     // Add other fields if available, else skip
        //   }));

        const simplified = response.data.results.map(movie => ({
            ...movie,
            genreText: movie.genre_ids.map(g => genresMapping[g]).join(', ')
        }))
          results.push(...simplified);

        } catch (error) {
          console.error(`Error fetching data for ${endpoint}`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 20 seconds
      }
  
      // Save to file
      const filename = `./datasets/${endpoint.replace('/', '_')}_${genresMapping[genreId] || 'all'}.json`;
      console.log(`Saving to ${filename}`);
      await fs.writeFile(path.resolve(__dirname, filename), JSON.stringify(results, null, 2));
    }
  }
  
  async function main() {
    const genres = await getGenres();
    genresMapping = genres.reduce((acc, genre) => ({ ...acc, [genre.id]: genre.name }), {});
    console.log(JSON.stringify(genresMapping, null, 2))
    await fetchDataByQuery('popular'); // Example for non-genre specific
    for (const genre of genres) {
      await fetchDataByQuery('genre', genre.id); // Example for genre-specific
    }
  }
  
  main().catch(console.error);
  
