const header = (section) => {
return `
<a href="${section == "Movies" ? "/index.html" : "/tv.html"}" >
  <img class="logo-new" src="/assets/images/chatflix-logo-new.png" />
  <img class="logo-small" src="/assets/images/chatflix-logo-square.png" />
</a>

<a class="top-nav${section == "Movies" ? " active" : ""}" href="/index.html">🎞️ Movies</a>
<a class="top-nav${section == "TV" ? " active" : ""}" href="/tv.html">&#x1f4fa; TV</a>

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
      width="24"
      height="24"
    />
  </div>

  <button class="search-btn" search-toggler menu-close>
    <img
      src="/assets//images/close.png"
      width="24"
      height="24"
      alt="open search box"
    />
  </button>
</div>

<button class="search-btn" search-toggler menu-close>
  <img
    src="/assets/images/search.png"
    width="24"
    height="24"
    alt="open search box"
  />
</button>

<button class="menu-btn" menu-btn menu-toggler>
  <img
    src="/assets/images/menu.png"
    alt="open menu"
    class="menu"
    width="24"
    height="24"
  />
  <img
    src="/assets/images/menu-close.png"
    alt="close menu"
    class="close"
    width="24"
    height="24"
  />
</button>
`
}   

export {header}
