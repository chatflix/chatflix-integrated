"use strict";

import { api_key, imageBaseURL, fetchDataFromServer } from "../api.js";
import { sidebar } from "./sidebar.js";
import { createMovieCard } from "./movie-card.js";
import { search } from "./search.js";
import '../jquery.js';

//const movieId = window.localStorage.getItem("movieId");
const movieId = window.MOVIE_ID; //injected by express router
const playerProxyUrl='/proxy';
const pageContent = document.querySelector("[page-content]");

sidebar();

const getGenres = function (genreList) {
  const newGenreList = [];

  for (const { name } of genreList) newGenreList.push(name);
  return newGenreList.join(", ");
};

const getCasts = function (castList) {
  const newCastList = [];

  for (let i = 0, len = castList.length; i < len && len && i < 10; i++) {
    const { name } = castList[i];
    newCastList.push(name);
  }
  return newCastList.join(", ");
};

const getDirectors = function (crewList) {
  const directors = crewList.filter(({ job }) => job === "Director");

  const directorList = [];
  for (const { name } of directors) directorList.push(name);
  return directorList.join(", ");
};

// returns only trailers and teasers as array
const filterVideos = function (videoList) {
  return videoList.filter(
    ({ type, site }) =>
      (type === "Trailer" || type === "Teaser") && site === "Youtube"
  );
};

fetchDataFromServer(
  `https://api.themoviedb.org/3/tv/${movieId}?api_key=${api_key}&append_to_response=casts,images`,
  function (movie) {
    const {
      backdrop_path,
      poster_path,
      name,
      first_air_date,
      vote_average,
      genres,
      overview,
    } = movie;

    document.title = `${name} - Chatflix`;

    const movieDetail = document.createElement("div");
    movieDetail.classList.add("movie-detail");
    movieDetail.innerHTML = `
                <div 
                class="backdrop-image" 
                style="background-image: url('${imageBaseURL}w1280${backdrop_path}')">
                </div>

                <div class="detail-box">
                <h1>${name}</h1>
                <div class="detail-content">
                    <iframe allowfullscreen 
                    style="aspect-ratio: 16/9; width: 100%; padding:0; border:0; overflow:hidden" 
                    id="illegalMovieStream" 
                    src="${playerProxyUrl}?url=https://vidsrc.to/embed/tv/${movieId}"></iframe>
                    <div class="meta-list">
                    <div class="meta-item">
                        <img
                        src="/assets/images/star.png"
                        width="20"
                        height="20"
                        alt="rating"
                        />
                        <span class="span">${vote_average.toFixed(1)}</span>
                    </div>


                    <div class="separator"></div>

                    <div class="meta-item">${first_air_date.split("-")[0]}</div>
                    </div>

                    <p class="genre">${getGenres(genres)}</p>

                    <p class="overview">${overview}</p>

                </div>

                <div class="title-wrapper hide">
                    <h3 class="title-large">Trailer and Clips</h3>
                </div>

                <div class="slider-list hide">
                    <div class="slider-inner"></div>
                </div>
                </div>
    `;

    /*
    for (const { key, name } of filterVideos(videos)) {
      const videoCard = document.createElement("div");
      videoCard.classList.add("video-card");

      videoCard.innerHTML = `
        <iframe width="500" height="294" src="https://www.youtube.com/embed/${key}?&theme=dark&color=white&rel=0" frameborder="0" allowfullscreen="1" title="${name}" class="img-cover" loading="lazy"></iframe>
        `;

      movieDetail.querySelector(".slider-inner").appendChild(videoCard);
    } */

    pageContent.appendChild(movieDetail);

    fetchDataFromServer(
      `https://api.themoviedb.org/3/tv/${movieId}/recommendations?api_key=${api_key}&page=1`,
      addSuggestedMovies
    );
  }
);

const addSuggestedMovies = function ({ results: movieList }, title) {
  const movieListElem = document.createElement("section");
  movieListElem.classList.add("movie-list");
  movieListElem.ariaLabel = "You May Also Like";

  movieListElem.innerHTML = `
    <div class="title-wrapper">
      <h3 class="title-large">You May Also Like</h3>
    </div>

    <div class="slider-list">
      <div class="slider-inner"></div>
    </div>
  `;

  for (const movie of movieList) {
    // Called from movie_card.js
    const movieCard = createMovieCard(movie);

    movieListElem.querySelector(".slider-inner").appendChild(movieCard);
  }
  pageContent.appendChild(movieListElem);
};


$("document").ready(function () {
  /*
  ui.start('#firebaseui-auth-container', {
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Other config options...
  }); */


  const searchBox = document.querySelector("[search-box]");
  const searchTogglers = document.querySelectorAll("[search-toggler]");

  addEventOnElements(searchTogglers, "click", function () {
    searchBox.classList.toggle("active");
  });

    console.log("DOM ready, jQuery is available to call on $")
    search();
    // window.AI = AI

})
