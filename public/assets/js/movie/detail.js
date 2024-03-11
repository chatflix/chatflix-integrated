"use strict";

import { api_key, imageBaseURL, fetchDataFromServer } from "../api.js";
import { sidebar } from "./sidebar.js";
import { createMovieCard } from "./movie-card.js";
import { search } from "./search.js";
import '../jquery.js';
import { shareButton } from "../share.js";
//const movieId = window.localStorage.getItem("movieId");
const movieId = window.MOVIE_ID; //injected by express router
const movieTitleSlug= window.MOVIE_TITLE;
const playerProxyUrl='/proxy';
const pageContent = document.querySelector("[page-content]");
const getPlayerUrl = (tmdbId, type="movie", player="classic") => {
  switch (player) {
      case "classic":
          return `/player/${type}/${tmdbId}?player=classic` //== legacy minus ads
      case "beta": 
          return type == "movie" ? `https://blackvid.space/embed?tmdb=${tmdbId}` : `https://blackvid.space/embed?tmdb=${tmdbId}&season=1&episode=1`

  }
}

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

    document.title = `${title} - Chatflix`;

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

                  <iframe allowfullscreen referrerpolicy="origin" id="chatflix-multiplex-player" 
                    style="aspect-ratio: 16/9; width: 100%; padding:0; border:0; overflow:hidden" 
                    src='${getPlayerUrl(movieId, "movie", "classic")}'></iframe>


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
                    
                    <div class="separator" style="padding: 0 3"></div>
                    <div class="meta-item" style=""><div class="share-button"></div></div>

                    <p class="overview">${overview}</p>

                    <ul class="detail-list">
                    <div class="list-item">
                        <p class="list-name">Streams</p>
                        <div>
                          <select id="player-selector" style="width: 100%">
                              <option value="classic">1) Chatflix Player (1080p, NO Ads, Fast Loading &amp; Great Selection)</option>
                              <option value="beta">2) Alternate Player (360p - 2160p, Subtitles in 30 languages, Ads)</option>
                          </select>
                       
                       
                          <p>
                          <small>By default, all movies and shows play in the Chatflix Player, in partnership with vidsrc... However if you need subtitles or captions, please use the alternate player for now until we have captions working in our ad free player.</small>      

                
                        </p>
                        </div>
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

                    <div class="list-item hide">
                      <p class="list-name">About Rating</p>
                      <p>G = "Family Entertainment, no sex, no swearing, no violence. Basically, Bambi or some cartoons"<br />
                         PG = "Parental Guidance... parents are trusted to use good judgment and determine if their kids should watch the movie"<br />
                         PG-13 = "Basically the same as above, except that parents are Strongly Cautioned that it may not be appropriate for kids who have not yet had a Bar Mitzvah lmao"<br />
                         R = "R-rated... Gratuitous violence and nearly unlimited swearing are on tap here, but sexual content is highly restricted: some ridiculous simulations of sexual activity and a few glimpses of the female breast are all that's permitted, to ensure young minds stay pure"<br />
                         NC-17 = "Adults only, AKA X rated... Movies that refuse to bow to the demands of these retards who want to censor the film often receive an NC-17 rating, as do many foreign films that (in their original countries) nobody finds shocking in the least. You'll find theaters in big, liberal cities playing such flicks... but in the Heartland, NC-17 is just too much for them bible thumpers."
                      </p>
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
    shareButton(`${title} | Now Streaming on Chatflix`, 
        `Watch ${title} for free on Chatflix! Chatflix has over 100,000 movies and TV episodes available for streaming in HD or casting to your TV, anywhere in the world, with no ads. Quite simply, Chatflix is the best streaming platform on this planet and the only streaming platform you will ever need` 
      , `https://chatflix.org/movie/${movieId}/${movieTitleSlug}?ref=nativeShareButton`,
      '.share-button');
      $(".copy-link").on("click", function (event) {
        event.preventDefault()
        copyTextToClipboard(`https://chatflix.org/movie/${movieId}/${movieTitleSlug}?ref=copyLinkButton`)
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

  //this is actually pretty simple, because the client no longer touches these dirty embeds, the server takes care of constructing the request and cleaning the scripts that come back

    console.log("DOM ready, jQuery is available to call on $")
    search();

})
