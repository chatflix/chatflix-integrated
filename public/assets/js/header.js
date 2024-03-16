const header = (section) => {
return `
<a href="${section == "Movies" ? "/movies" : "/tv"}" >
  <img class="logo-new" src="/assets/images/chatflix-web-full.png" />
  <img class="logo-small" src="/assets/images/chatflix-logo-small.png" />
</a>

<a class="top-nav${section == "Movies" ? " active" : ""}" href="/movies">🎞️ Movies</span></a>
<a class="top-nav${section == "TV" ? " active" : ""}" href="/tv">&#x1f4fa; TV</span></a>

<div class="search-box" search-box>
  <div class="search-wrapper" search-wrapper>
    <input
      type="text"
      name="search"
      aria-label="search ${section == "Movies" ? "movies" : "TV shows"}"
      placeholder="Search for ${section=="Movies" ? "movies" : "tv shows"}..."
      class="search-field"
      autocomplete="off"
      search-field
    />
    <img
      src="/assets/images/search.png"
      alt="search"
      class="leading-icon"
      width="22"
      height="22"
    />
  </div>

  <button  class="search-btn" search-toggler menu-close>
    <img
      src="/assets//images/close.png"
      width="22"
      height="22"
      />
  </button>
</div>

<button class="search-btn" search-toggler menu-close>
  <img
    src="/assets/images/search.png"
    width="22"
    height="22"
    alt="Search for ${section == "Movies" ? "movies" : "TV shows"}"
    title="Search for ${section == "Movies" ? "movies" : "TV shows"}"
  />
</button>

<button class="menu-btn" menu-btn menu-toggler>
  <img
    src="/assets/images/menu.png"
    alt="Browse Categories"
    title="Browse Categories"
    class="menu"
    width="22"
    height="22"
  />
  <img
    src="/assets/images/menu-close.png"
    alt="Close Menu"
    class="close"
    width="22"
    height="22"
  />

</button>
`
}   

export {header}
