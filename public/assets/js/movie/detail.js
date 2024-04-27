"use strict";

import { api_key, imageBaseURL, fetchDataFromServer } from "../api.js";
import { sidebar } from "./sidebar.js";
import { createMovieCard } from "./movie-card.js";
import { search } from "./search.js";
import '../jquery.js';
import { shareButton } from "../share.js";
import { getPlayerUrl, streamPicker } from "../multi-player.js";
//const movieId = window.localStorage.getItem("movieId");
const movieId = window.MOVIE_ID; //injected by express router
const movieTitleSlug= window.MOVIE_TITLE;
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
 const getSimplifiedMovieInfo = (rawMovieData) => {
  return {
    title: rawMovieData.title,
    genres: rawMovieData.genres.map(genre => genre.name),
    plot_summary: rawMovieData.overview,
    cast: rawMovieData.casts.cast.slice(0, 10).map(castMember => castMember.name), // assuming we limit to top 10 cast members for brevity
    director: rawMovieData.casts.crew.find(crewMember => crewMember.job === "Director")?.name || "Unknown",
    original_language: rawMovieData.original_language,
    release_date: rawMovieData.release_date,
    runtime: rawMovieData.runtime,
    average_score: rawMovieData.vote_average,
    vote_count: rawMovieData.vote_count,
    poster_path: `https://image.tmdb.org/t/p/original${rawMovieData.poster_path}`,
    backdrop_path: `https://image.tmdb.org/t/p/original${rawMovieData.backdrop_path}`

  }
 }
// returns only trailers and teasers as array
const filterVideos = function (videoList) {
  return videoList.filter(
    ({ type, site }) =>
      (type === "Trailer" || type === "Teaser") && site === "Youtube"
  );
};

fetchDataFromServer(
  `https://api.themoviedb.org/3/movie/${movieId}?api_key=${api_key}&append_to_response=casts,videos,images,releases`,
  function (movie) {
    const {
      backdrop_path,
      poster_path,
      title,
      release_date,
      runtime,
      vote_average,
      releases: {
        countries: [{ certification }],
      },
      genres,
      overview,
      casts: { cast, crew },
      videos: { results: videos },
    } = movie;
    //console.log(JSON.stringify(getSimplifiedMovieInfo(movie), null, 2));
    //alert("hamster")

    
    //document.title = `${title} - Chatflix`;

    const movieDetail = document.createElement("div");
    movieDetail.classList.add("movie-detail");
    movieDetail.innerHTML = `
                <div 
                class="backdrop-image" 
                style="background-image: url('${imageBaseURL}w1280${backdrop_path}')">
                </div>

                <div class="detail-box">
                <h1 style="font-size:1.2em">${title}</h1>
                <div class="detail-content" style="font-size:0.9em">

                  <!-- Sharing Utensils: above the player -->
                  <div class="meta-list" style="margin: 10px">

                      <div class="meta-item" style=""><div class="share-button"></div></div>

                      <a class="meta-item sharing-utensil" 
                      href="https://www.facebook.com/sharer/sharer.php?u=${window.OG_URL}"
                      target="_blank"
                      rel="noopener noreferrer">
                      <button><i class="fa-brands fa-facebook"></i> Post</button></a>
                      
                      <a class="meta-item sharing-utensil"
                      href="https://twitter.com/intent/tweet?text=Watch ${title}. Now streaming on Chatflix!&url=${window.OG_URL}"
                      target="_blank"
                      rel="noopener noreferrer">
                      <button><i class="fa-brands fa-twitter"> </i> Tweet</button></a>
            
                      <a class="meta-item sharing-utensil"
                      href="https://api.whatsapp.com/send?text=${window.OG_URL}"
                      target="_blank"
                      rel="noopener noreferrer">
                      <button><i class="fa-brands fa-whatsapp"></i> Send </button></a>

                  </div>
                  <!-- End Sharing Utensils -->
                  <iframe allowfullscreen referrerpolicy="origin" id="chatflix-multiplex-player" 
                    style="aspect-ratio: 16/9; width: 100%; padding:0; border:0; overflow:hidden" 
                    src='${window.STREAM_LOADER_URL}'></iframe>


                    <div class="meta-list" style="margin-top:10px">
                    <div class="meta-item">
                        <img
                        src="/assets/images/star.png"
                        width="20"
                        height="20"
                        alt="rating"
                        />
                        <span class="span">${vote_average.toFixed(2)}</span>
                    </div>

                    <div class="separator" style="padding: 0 3"></div>

                    <div class="meta-item">${runtime}m</div>

                    <div class="separator" style="padding: 0 3"></div>

                    <div class="meta-item">${release_date.split("-")[0]}</div>
                    
                    <!--
                    <div class="separator" style="padding: 0 3"></div>
                    <div class="meta-item" style=""><div class="share-button"></div></div>
                    -->

                    <p class="overview">${overview}</p>

                    <ul class="detail-list">
                    <div class="list-item" style="display:none">
                        <p class="list-name">Streams</p>
                        ${streamPicker()}
                        </div>
                    <div class="list-item">
                        <p class="list-name">Genres</p>
                        <p>${getGenres(genres)}</p>
                    </div>


                    <div class="list-item">
                        <p class="list-name">Starring</p>
                        <p>${getCasts(cast)}</p>
                    </div>

                    <div class="list-item">
                        <p class="list-name">Directed By</p>
                        <p>${getDirectors(crew)}</p>
                    </div>

                    </ul>
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

    shareButton(`Watch ${title}... Now Streaming on Chatflix`, 
        overview, 
        window.OG_URL,
      '.share-button');


      $(".copy-link").on("click", function (event) {
        event.preventDefault()
        copyTextToClipboard(`${window.OG_URL}`)
      })


      $("#player-selector").change(function(e) {

        var selectedValue = $(this).val();
        const url = getPlayerUrl(movieId, "movie", selectedValue)
        $("#chatflix-multiplex-player").attr("src", url)
    });


    fetchDataFromServer(
      `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${api_key}&page=1`,
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

    //paywall
    enforceMembershipForContentPages(); //assumes membership is loaded and can be referenced

})
