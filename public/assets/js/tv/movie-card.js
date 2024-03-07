"use strict";

import { imageBaseURL } from "../api.js";

// movie card

export function createMovieCard(movie) {
  const { poster_path, name, vote_average, first_air_date, id } = movie;

  const card = document.createElement("div");
  card.classList.add("movie-card");

  card.innerHTML = `
    <figure class="poster-box card-banner">
      <img
        src="${imageBaseURL}w342${poster_path}"
        alt="${name}"
        class="img-cover"
        loading="lazy"
      />
    </figure>

    <h4 class="name">${name}</h4>

    <div class="meta-list">
      <div class="meta-item">
        <img
          src="/assets/images/star.png"
          width="20"
          height="20"
          loading="lazy"
          alt="rating"
        />
        <span class="span">${vote_average.toFixed(1)}</span>
      </div>

      <div class="card-badge">${first_air_date.split("-")[0]}</div>
    </div>

    <a href="/tv/${id}/${sanitizeString(name)}" class="card-btn" title="${name}"></a>
  `;

  return card;
}
