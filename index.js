const express = require('express');
const request = require('request');
const { parse } = require('node-html-parser');
const mustacheExpress = require('mustache-express');
const membership = require('./membership/membership');
const users = require('./user/membership')
const cors = require('cors');
const { type } = require('requests');

const app = express();
app.use(cors())
const port = process.env.PORT || 5000;
// Serve static files from the "public" directory
app.use(express.static('public'));
// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());
// Set mustache as the view engine for Express
app.set('view engine', 'mustache');
// Set the directory where the templates are located
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  
  // You can now use movieId and movieTitle to fetch data and render a template
  res.render('homepage', { // Assuming you have a 'movie.mustache' template
      page_title: "Movies",
      page_module: "movie/index",
  });
});

app.get('/movies', (req, res) => {
  
  // You can now use movieId and movieTitle to fetch data and render a template
  res.render('homepage', { // Assuming you have a 'movie.mustache' template
      page_title: "Movies",
      page_module: "movie/index",
  });
});



app.get('/movies/list', (req, res) => {
  
  res.render('movie-list', { 
      page_title: req.query.genre+" Movies",
      with_genres: req.query.with_genres,
      genre_name: req.query.genre,
      page_module: "movie/movie-list"
  });
});

app.get('/tv/list', (req, res) => {
  
  // Note that the tv list page is the same as the movie list page, just with a different JS module... 
  res.render('movie-list', { 
    page_title: req.query.genre+" Series",
    with_genres: req.query.with_genres,
    genre_name: req.query.genre,
    page_module: "tv/movie-list"
});
});


app.get('/tv', (req, res) => {
  
  // You can now use movieId and movieTitle to fetch data and render a template
  res.render('homepage', { // Assuming you have a 'movie.mustache' template
      page_title: "TV",
      page_module: "tv/index",
  });
});

app.get('/movie/:movieId/:movieTitle', (req, res) => {
  const { movieId, movieTitle } = req.params;
  // You can now use movieId and movieTitle to fetch data and render a template
  res.render('movie-details', { // Assuming you have a 'movie.mustache' template
      movieId,
      movieTitle
  });
});

app.get('/tv/:movieId/:movieTitle', (req, res) => {
  const { movieId, movieTitle } = req.params;
  // Fetch series details using seriesId and seriesTitle
  res.render('tv-details', { // Assuming you have a 'series.mustache' template
      movieId,
      movieTitle
  });
});



app.get('/account', (req, res) => {
  
  // You can now use movieId and movieTitle to fetch data and render a template
  res.sendFile('/public/account.html');
});

app.get('/activate', (req, res) => {
  
  // You can now use movieId and movieTitle to fetch data and render a template
  res.sendFile('/public/activate.html');
});



// app.get('/tv/:seriesId/:seriesTitle/:season/:episode', (req, res) => {
//   const { seriesId, seriesTitle, season, episode } = req.params;
//   // Use the parameters to fetch details for the specific episode
//   res.render('episode-details', { // Assuming you have an 'episode.mustache' template
//       seriesId,
//       seriesTitle,
//       season,
//       episode
//   });
// });

//this function loads a url that we wish to embed in one of our pages, but which contains ads or other malware...
//by retrieving the content, injecting some basic ad blocking and anti-XSS code into the page, and then serving it to the client 
//we get rid of most of the troublesome ads... and we gain full control over the contents because its same origin :)
const proxyWithAdBlock = (urlToProxy, res) => {
  request(urlToProxy, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const root = parse(body);
      const head = root.querySelector('head');
      const scriptContent = `
      window.open = function() {
        console.log('Blocked window.open call');
        return null;
      };
      window.history = {
        pushState: function() {
          console.log('Blocked history.pushState call');
          return null;
        },
        replaceState: function() {
          console.log('Blocked history.replaceState call');
          return null;
        },
        back: function() {
          console.log('Blocked history.back call');
          return null;
        }
      }
      function restoreConsole() {
        // Create an iframe for start a new console session
        var iframe = document.createElement('iframe');
        // Hide iframe
        iframe.style.display = 'none';
        // Inject iframe on body document
        document.body.appendChild(iframe);
        // Reassign the global variable console with the new console session of the iframe 
        console = iframe.contentWindow.console;
        window.console = console;
        // Don't remove the iframe or console session will be closed
      }
      

        document.addEventListener('DOMContentLoaded', (event) => {
          setTimeout(() => {
            // Override window.open
            window.open = function() {
              console.log('Blocked window.open call');
              return null;
            };
  
            // Intercept clicks on <a target="_blank">
            document.querySelectorAll('a[target="_blank"]').forEach(link => {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Blocked opening a new tab for', this.href);
                // You can redirect the URL here if needed
              });
            });

            restoreConsole();
            //setTimeout(restoreConsole, 10000)
          })

        });
      `;

      const scriptEl = parse(`<script>${scriptContent}</script>`);
      head.appendChild(scriptEl);

      // remove the script tag that came with the page, and replace with a reference to a modified version of the script on chatflix server...
      // the modified version has been altered to remove malware affecting devtools
      res.send(root.toString()) //.replace(`<script type="text/javascript" src="assets/embed/min/all.js?v=65530633"></script>`, `<script src='/assets/js/external/vidsrc_all.js'></script>`));
    } else {
      console.error('Error proxying:', error);
      res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chatflix - Movie Not Available</title>
      <style>
        body, html {
          height: 100%;
          margin: 0;
          color: white;
          background-color: black;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          flex-direction: column;
          font-family: Arial, sans-serif;
        }
        img {
          max-width: 80%;
          max-height: 45vh; /* Adjusts the image size to maintain the 16:9 aspect ratio within the iframe */
          object-fit: contain;
        }
        .message {
          margin-top: 20px;
          font-size: 20px;
        }
      </style>
      </head>
      <body>

      <img src="/img/404.webp" alt="Chatflix Error">
      <div class="message">
        <p>Oops! There's a problem with this movie.</p>
        <p>We're working on it. Please try another movie.</p>
      </div>

      </body>
      </html>

      `);
    }
  });

}

app.use('/player/:type/:tmdbId', (req, res) => {
  const urlToProxy = req.query.url;
  if (urlToProxy) {
    //deprecated but permitted... prefer passing parameterized player
    console.log("[debug] proxying directly specified url: " + urlToProxy);
    return proxyWithAdBlock(urlToProxy, res);
  } else {
    const {type, tmdbId} = req.params
    const playerId = req.query.player || 'classic'
    const streams= require('./public/data/providers/hosts.json')
    const stream = streams.find(stream => stream.id === playerId)

    console.log ("[debug] creating player: " + {type, tmdbId, playerId, stream})

    if (!stream) 
      return res.status(404).send('Player not found for id: ' + playerId);
    else {
        const playerUrl = stream[type + '_url'].replace('{id}', tmdbId);
        console.log("[debug] upstream player url: " + playerUrl);
        console.log("[debug] player will be downloaded and sanitized en route to client...")
        return proxyWithAdBlock(playerUrl, res);
      }
  }
});


//this is the intelligent stream loader in /views/meta-player.mustache
//given the content type and id, it will perform a health check on the .to and .xyz sources
//preferentially load .to (because its a better stream and we control the adblock)
//and fail over to .xyz (also ad free, but we pay for the stream and quality is less good)
app.get('/stream/:type/:tmdbId', (req, res) => {
  const {type, tmdbId} = req.params

   res.render('meta-player', {type: type,  id: tmdbId})
})

membership.httpApi(app, '/api/membership');
users.httpApi(app, '/api/user')

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
