"use strict";

import { api_key, fetchDataFromServer } from "../api.js";

export function sidebar() {
  // Fetch all genres then change genre format
  const genreList = {};

  fetchDataFromServer(
    `https://api.themoviedb.org/3/genre/tv/list?api_key=${api_key}`,
    function ({ genres }) {
      for (const { id, name } of genres) {
        genreList[id] = name;
      }
      genreLink();
    }
  );

  const sidebarInner = document.createElement("div");
  sidebarInner.classList.add("sidebar-inner");

  sidebarInner.innerHTML = `
      <div class="sidebar-list">
        <p class="title"><a href="/tv-list.html" menu-close class="sidebar-link" onclick='getMovieList("language=en-US", "Trending")'>Trending Now</a></p>
        <p class="title"><a href="/tv-list.html" menu-close class="sidebar-link" onclick='getMovieList("language=en-US", "Popular")'>Top Rated</a></p>
        <p>&nbsp;</p>
        <p class="title">Genres...</p>

      </div>
      <div class="sidebar-list">
        <p class="title">Language</p>

        <a href="/tv-list.html" menu-close class="sidebar-link" onclick='getMovieList("language=en-US", "English")'>English</a>

        <a href="/tv-list.html" menu-close class="sidebar-link" onclick='getMovieList("language=es", "Spanish")'>Spanish</a>
        
        <a href="/tv-list.html" menu-close class="sidebar-link" onclick='getMovieList("language=fr", "French")'>French</a>

      </div>
      <div class="sidebar-footer">
        <p class="copyright">WARNING: This website has been condemned by the Motion Picture Association and its greedy attorneys. For educational purposes only.</p>
        <br/>
        <img
          src="/assets/images/sociopathic-hamster.webp"
          alt="sociopathic hamster"
          width="130"
          height="130"
        />
        <br />
        <i>
          A Sociopathic Hamster production. Made in a warm, sunny developing country.
      </div>
  `;

  const genreLink = function () {
    for (const [genreId, genreName] of Object.entries(genreList)) {
      const link = document.createElement("a");
      link.classList.add("sidebar-link");
      link.setAttribute("href", "/tv-list.html");
      link.setAttribute("menu-close", "");
      link.setAttribute(
        "onclick",
        `getMovieList("with_genres=${genreId}", "${genreName}")`
      );
      link.textContent = genreName;
      sidebarInner.querySelectorAll(".sidebar-list")[0].appendChild(link);
    }

    const sidebar = document.querySelector("[sidebar]");
    sidebar.appendChild(sidebarInner);
    toggleSidebar(sidebar);
  };

  const toggleSidebar = function (sidebar) {
    // Toggle sidebar in Mobile Screen
    const sidebarBtn = document.querySelector("[menu-btn]");
    const sidebarTogglers = document.querySelectorAll("[menu-toggler]");
    const sidebarClose = document.querySelectorAll("[menu-close]");
    const overlay = document.querySelector("[overlay]");

    addEventOnElements(sidebarTogglers, "click", function () {
      sidebar.classList.toggle("active");
      sidebarBtn.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    addEventOnElements(sidebarClose, "click", function () {
      sidebar.classList.remove("active");
      sidebarBtn.classList.remove("active");
      overlay.classList.remove("active");
    });
  };
}