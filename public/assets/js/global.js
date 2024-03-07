"use strict";

// Add event on multiple elements

const addEventOnElements = function (elements, eventType, callback) {
  for (const elem of elements) elem.addEventListener(eventType, callback);
};

// Toggle Search box in mobile device || small screen

const searchBox = document.querySelector("[search-box]");
const searchTogglers = document.querySelectorAll("[search-toggler]");

addEventOnElements(searchTogglers, "click", function () {
  searchBox.classList.toggle("active");
});

// store movieId in 'localStorage' when you click any movie card

const getMovieDetail = function (movieId) {
  window.localStorage.setItem("movieId", String(movieId));
};

const getMovieList = function (urlParam, genreName) {
  window.localStorage.setItem("urlParam", urlParam);
  window.localStorage.setItem("genreName", genreName);
};
const sanitizeString=(inputString) =>{
  // Remove non-alphanumeric characters except spaces
  let sanitizedString = inputString.replace(/[^a-zA-Z0-9 ]/g, '');

  // Replace spaces with hyphens
  sanitizedString = sanitizedString.replace(/\s+/g, '-');

  return sanitizedString;
}
