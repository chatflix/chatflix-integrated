"use strict";

// import all components and functions
import '../jquery.js';
import {AI} from "../ai.js";

import { sidebar } from "./sidebar.js";
import { api_key, imageBaseURL, fetchDataFromServer } from "../api.js";
import { createMovieCard } from "./movie-card.js";
import { search } from "./search.js";
import {db, auth, analytics, ui} from '../firebase.js'
// discover query: https://api.themoviedb.org/3/discover/tv?with_watch_providers=2|3|8|9|10&watch_region=US&api_key=829a43a98259bc44cae297489c7e3bba&&language=en-US&page=1&sort_by=vote_count.desc
const pageContent = document.querySelector("[page-content]");

sidebar();

// Home page sections (Top rated, Upcoming, Trending Movies)
const homePageSections = [
  {
    title: "Top Rated Shows",
    path: "https://api.themoviedb.org/3/discover/tv?with_watch_providers=2|3|8|9|10&watch_region=US&api_key=829a43a98259bc44cae297489c7e3bba&language=en-US&page=1&sort_by=vote_count.desc",
  },
  {
    title: "Popular Right Now",
    path: "https://api.themoviedb.org/3/trending/tv/day?language=en-US&page=1&api_key=829a43a98259bc44cae297489c7e3bba",
  }
];

// Fetch all genres then change genre format
const genreList = {
  // create genre string from genre_id eg: [23, 43] -> "Action, Romance".
  asString(genreIdList) {
    let newGenreList = [];

    for (const genreId of genreIdList) {
      this[genreId] && newGenreList.push(this[genreId]);
      // this.genreList;
    }
    return newGenreList.join(", ");
  },
};

fetchDataFromServer(
  `https://api.themoviedb.org/3/genre/tv/list?api_key=${api_key}`,
  function ({ genres }) {
    for (const { id, name } of genres) {
      genreList[id] = name;
    }

    fetchDataFromServer(
      `https://api.themoviedb.org/3/discover/tv?with_watch_providers=2|3|8|9|10&watch_region=US&api_key=829a43a98259bc44cae297489c7e3bba&language=en-US&page=1&sort_by=vote_count.desc`,
      heroBanner
    );
  }
);

const heroBanner = function ({ results: movieList }) {

  const banner = document.createElement("section");
  banner.classList.add("banner");
  banner.ariaLabel = "Popular Shows";

  banner.innerHTML = `
    <div class="banner-slider"></div>

    <div class="slider-control">
      <div class="control-inner">
      </div>
    </div>
  `;

  let controlItemIndex = 0;

  for (const [index, movie] of movieList.entries()) {
    const {
      backdrop_path,
      name,
      first_air_date,
      genre_ids,
      overview,
      poster_path,
      vote_average,
      id,
    } = movie;

    const sliderItem = document.createElement("div");
    sliderItem.classList.add("slider-item");
    sliderItem.setAttribute("slider-item", "");

    sliderItem.innerHTML = `
      <img
        src="${imageBaseURL}w1280${backdrop_path}"
        alt="${name}"
        class="img-cover"
        loading="${index === 0 ? "eager" : "lazy"}"
      />
      <div class="banner-content">
        <h2 class="heading">${name}</h2>

        <div class="meta-list">
          <div class="meta-item">${first_air_date.split("-")[0]}</div>
          <div class="meta-item card-badge">${vote_average.toFixed(1)}</div>
        </div>
        <p class="genre">${genreList.asString(genre_ids)}</p>
        <p class="banner-text">${overview}</p>

        <a href="/tv/${id}/${sanitizeString(name)}" class="btn">
          <img
            src="./assets/images/play_circle.png"
            width="24"
            height="24"
            aria-hidden="true"
            alt="play circle"
          />
          <span class="span">Watch Now</span>
        </a>
      </div>
    `;

    banner.querySelector(".banner-slider").appendChild(sliderItem);

    const controlItem = document.createElement("button");
    controlItem.classList.add("poster-box", "slider-item");
    controlItem.setAttribute("slider-control", `${controlItemIndex}`);

    controlItemIndex++;

    controlItem.innerHTML = `
      <img
        src="${imageBaseURL}w154${poster_path}"
        alt="Slide to ${name}"
        loading="lazy"
        draggable="false"
        class="img-cover"
      />
    `;
    banner.querySelector(".control-inner").appendChild(controlItem);
  }
  pageContent.appendChild(banner);

  addHeroSlide();

  // fetch data from home page sections (top rated, upcoming,trending).
  for (const { title, path } of homePageSections) {
    fetchDataFromServer(
      path,
      createMovieList,
      title
    );
  }
};

// Hero Slider Functionality
const addHeroSlide = function () {
  const sliderItems = document.querySelectorAll("[slider-item]");
  const sliderControls = document.querySelectorAll("[slider-control]");

  let lastSliderItem = sliderItems[0];
  let lastSliderControl = sliderControls[0];
  let currentSliderIndex = 0;

  lastSliderItem.classList.add("active");
  lastSliderControl.classList.add("active");

  const sliderStart = function () {
    const controlIndex = Number(this.getAttribute("slider-control"));
    if (currentSliderIndex !== controlIndex) {
      lastSliderItem.classList.remove("active");
      lastSliderControl.classList.remove("active");

      sliderItems[controlIndex].classList.add("active");
      this.classList.add("active");

      lastSliderItem = sliderItems[controlIndex];
      lastSliderControl = this;
      currentSliderIndex = controlIndex;
    }
  };

  const slideToNext = function () {
    const nextIndex = (currentSliderIndex + 1) % sliderItems.length;
    sliderControls[nextIndex].click();
  };

  // Automatic sliding every 5 seconds
  setInterval(slideToNext, 5000);

  addEventOnElements(sliderControls, "click", sliderStart);
};

const createMovieList = function ({ results: movieList }, title) {
  const movieListElem = document.createElement("section");
  movieListElem.classList.add("movie-list");
  movieListElem.ariaLabel = `${title}`;

  movieListElem.innerHTML = `
    <div class="title-wrapper">
      <h3 class="title-large">${title}</h3>
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

search();
window.AI = AI
$("document").ready(function () {
  /*
  ui.start('#firebaseui-auth-container', {
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Other config options...
  }); */
    console.log("DOM ready, jQuery is available to call on $")
})
