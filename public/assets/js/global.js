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


function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
    alert("Link Copied to Clipboard")
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
    alert("Link Copied to Clipboard")

  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

function getFlixifiedLocation() {
  //converts a URL into something a ditsy flixxi can understand
  if (location.href.indexOf("/tv/") > -1) {
    // specific TV show
    return "TV Screening Room"
  } else if (location.href.indexOf("/movie/") > -1) { 
    // specific movie
    return "Movie Screening Room"
  } else if (location.href.contains("tv.html")) {
    //lobby - TV shows
    return "Main Lobby - TV Shows"
  } else if (location.href.contains("tv-list.html")) {
    return "Browsing by Category - TV Shows"
  } else if (location.href.contains("movie-list.html")) {
    return "Browsing by Category - Movies"
  } else if (location.href.contains("ico.html")){
    return "Investor Relations, Corporate Office, or Crypto Sales Area"
  } else {
    return "Main Lobby - Movies"
  }
}
function getCurrentUserNameForFlixxi() {
  return "Unknown - Not Logged In" 
  //will return either the user's first name or unknown based on login status
}

//as the user moves about the platform, browsing or viewing content, we keep flixxi informed via cross domain message passing
//so she knows what they're trying to accomplish, and can help them right away
//
//like "find me more movies by this director" - useless prompt without context, but totally serviceable prompt if we tell Flixxi that the user's watching Spiderman
function setFlixxiContext(contextData) {
  const systemContext=` 
About Flixxi
--------  
Your name is Flixxi, and you are a fun, friendly, and flirti assistant at the Chatflix meta-theatre, home to over 100,000 movies and TV shows, and the only streaming platform you'll ever need. 

Your job is to help guests find movies and TV shows they're looking for, and to answer questions about whatever movie the guest is currently watching. 
  
Based on the context below, and using the tools we have provided to you, please assist the user to the best of your ability. 
  
If you are unable to give the user what they want, and the user becomes frustrated or asks to talk to a human, please call the escalate function and summarize the issue so that our engineers can resolve it.
  
Context
--------
User Name: ${getCurrentUserNameForFlixxi()}
User Membership Status: Free
Logged In: No
Location (General Area): ${getFlixifiedLocation()}
Details: ${contextData}
  `

  //post message to the iframe with id flixxis-office
  document.getElementById('flixxis-office').contentWindow.postMessage(systemContext, '*');
}
function loadFlixxiFromExternalURL(url="https://chatflix.xyz?viewmode=widget&persona=flixxi") {
  document.body.innerHTML += `<!-- Begin Flixxi Chat Widget-->
  <div id="widget-trigger" class="widget-trigger">
      <img src="path-to-your-image.png" alt="Ask Flixxi">
      <p>Ask Flixxi</p>
  </div>
  
  <div id="widget-container" class="widget-container">
      <div id="widget-close" class="widget-close">X</div>
      <iframe id="flixxis-office" style="position:fixed; margin: 0px 0px 0px 0px; padding: 0px 0px 0px 0px; border: none; width: 100%; height: 100%;" src="${url}"></iframe>
  </div>
  <!-- End Flixxi Chat Widget-->
`
  document.getElementById('widget-trigger').onclick = function() {
      document.getElementById('widget-container').style.display = 'block';
  };

  document.getElementById('widget-close').onclick = function() {
      document.getElementById('widget-container').style.display = 'none';
  };


  //start listening in case the app inside the flixxis-office iframe posts a message
  window.addEventListener("message", function(event) {
      if (event.data) {
          switch (event.data.type) {
              case "close":
                  document.getElementById('widget-container').style.display = 'none';
                  break;
          }
          setFlixxiContext(event.data);
      }
  });
}
