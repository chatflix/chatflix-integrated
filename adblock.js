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
        res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting...</title>
        </head>
        <body>
          <script>window.location.href="${urlToProxy.replace('.to', '.xyz')}"</script>
        </body>
        </html>
  
        `);
      }
    });
  
  }
  
  
  const express = require('express');
  const request = require('request');
  const { parse } = require('node-html-parser');
  const mustacheExpress = require('mustache-express');
  const cors = require('cors')
  
  const app=express()
  app.use(cors())
  const port=process.env.PORT || 5000
  app.use(express.static('public'))
  
  //templating engine
  app.engine('mustache', mustacheExpress)
  app.set('view engine', 'mustache');
  app.set('views', __dirname + '/views');
  
  //vidsrc.to proxy ad blocker
  //the tmdbId can be a tmdb ID (integer) or imdb ID (begins with tt) - vidsrc will sort it out
  app.use('/player/movie/:tmdbId', (req, res) => {
          const vidsrcUrl = `https://vidsrc.to/embed/movie/${req.params.tmdbId}`
          return proxyWithAdBlock(vidsrcUrl, res)
  })
  app.use('/player/tv/:tmdbId', (req, res) => {
          const {season, episode} = req.query
          const seasonEpisodeSlug = (season && episode) ? `/${season}/${episode}` : ''
          const vidsrcUrl = `https://vidsrc.to/embed/tv/${req.params.tmdbId}${seasonEpisodeSlug}`
          return proxyWithAdBlock(vidsrcUrl, res)
  })