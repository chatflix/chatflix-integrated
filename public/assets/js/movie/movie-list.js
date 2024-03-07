"use strict";

import { api_key, fetchDataFromServer } from "../api.js";

import { sidebar } from "./sidebar.js";

import { createMovieCard } from "./movie-card.js";

import { search } from "./search.js";

// collection of genre name & url parameters from local storage
const genreName = window.localStorage.getItem("genreName");
const urlParam = window.localStorage.getItem("urlParam");

const pageContent = document.querySelector("[page-content]");
const getApiRoute=(genre, query, page) => {
  //special cases
  if (genre == "New") {
    return `https://api.themoviedb.org/3/movie/now_playing?api_key=${api_key}&sort_by=release_date.desc&page=${page}&language=en-US`
  } else if (genre == "Popular") {
    return `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&include_adult=false&page=${page}&${query}`
  } else if (genre == "Now Playing") {
    return `https://api.themoviedb.org/3/movie/now_playing?api_key=${api_key}&sort_by=popularity.desc&page=${page}&language=en-US`
  } else {
    return `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc=en-US&page=${page}&${query}`
  }
}
sidebar();

let currentPage = 1;
let totalPages = 0;

fetchDataFromServer(
  getApiRoute(genreName, urlParam, currentPage),
  function ({ results: movieList, total_pages }) {
    totalPages = total_pages;
    document.title = `${genreName} Movies - Chatflix`;

    const movieListElem = document.createElement("section");
    movieListElem.classList.add("movie-list", "genre-list");
    movieListElem.ariaLabel = `${genreName} Movies`;

    movieListElem.innerHTML = `
        <div class="title-wrapper">
          <h1 class="heading">All ${genreName} Movies</h1>
        </div>

        <div class="grid-list">
        </div>

        <button class="btn load-more" load-more>Load More</button>
    `;

    // add movie card based on fetched item
    for (const movie of movieList) {
      const movieCard = createMovieCard(movie);
      movieListElem.querySelector(".grid-list").appendChild(movieCard);
    }

    pageContent.appendChild(movieListElem);

    //   load more button functionality
    document
      .querySelector("[load-more]")
      .addEventListener("click", function () {
        if (currentPage >= total_pages) {
          this.style.display = "none"; // this == load-more-btn
          return;
        }
        currentPage++;
        this.classList.add("loading"); // this == load-more-btn

        fetchDataFromServer(
          getApiRoute(genreName, urlParam, currentPage),
          ({ results: movieList }) => {
            this.classList.remove("loading"); // this == load-more-btn

            for (const movie of movieList) {
              const movieCard = createMovieCard(movie);
              movieListElem.querySelector(".grid-list").appendChild(movieCard);
            }
          }
        );
      });
  }
);

search();
