const express = require('express');
const request = require('request');
const { parse } = require('node-html-parser');
const mustacheExpress = require('mustache-express');

const app = express();
const port = process.env.port || 5000;
// Serve static files from the "public" directory
app.use(express.static('public'));
// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());
// Set mustache as the view engine for Express
app.set('view engine', 'mustache');
// Set the directory where the templates are located
app.set('views', __dirname + '/views');

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


app.use('/proxy', (req, res) => {
  const urlToProxy = req.query.url;
  if (!urlToProxy) {
    return res.status(400).send('URL is required');
  }

  request(urlToProxy, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const root = parse(body);
      const head = root.querySelector('head');
      const scriptContent = `
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
            console.log('Proxying ${urlToProxy}');
          })

        });
      `;

      const scriptEl = parse(`<script>${scriptContent}</script>`);
      head.appendChild(scriptEl);
      res.send(root.toString());
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
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
