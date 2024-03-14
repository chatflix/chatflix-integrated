const players = [{id: "classic", desc: "Server #1 - HD, No Ads, Original Chatflix Player"}, {id: "beta", desc: "[Beta] Server #2 - Enhanced Player w/Captions"}, {id: "alt", desc: "[Alternate] Server #3 - Best Captions, Some Ads"}]


//classic = premium streams from vidsrc
//alt = hacked streams from vidsrc
//beta = ???
const getPlayerUrl = (tmdbId, type="movie", player="classic") => {
    switch (player) {
  
        case "classic":  
            return `https://vidsrc.net/embed/${type}/${tmdbId}`    
        
        case "beta":
            return `/player/${type}/${tmdbId}?url=https://vidsrc.to/embed/${type}/${tmdbId}`
          case "alt": 
            return type == "movie" ? `https://blackvid.space/embed?tmdb=${tmdbId}` : `https://blackvid.space/embed?tmdb=${tmdbId}&season=1&episode=1`
  
    }
  }  
/**
 * Generates the embed code to stream a movie or a tv show. The player comes with basic playing utensils, and a selector to try different servers if one is down.
 *
 * @param {string} tmdbId - The tmdbId of the player
 * @param {string} type - The type of the player
 * @param {string} [selectedIndex="0"] - Determines the default player and streaming provider. 0 is classic, 1 is beta, 2 is not recommended
 * @return {string} The iframe and player selector HTML content
 */
const embedPlayer= (tmdbId, type, selectedIndex="0") => {
    const playerProxyUrl = "/player"
    return  `<iframe allowfullscreen 
    style="aspect-ratio: 16/9; width: 100%; padding:0; border:0; overflow:hidden" 
    id="chatflix-multiplex-player-${tmdbId}" 
    src="${playerProxyUrl}/${type}/${tmdbId}?player=${players[selectedIndex].id}" 
    frameborder="0"></iframe>
    
    
    `

    
}


const streamPicker = () => {
    return `                <div>
    <select id="player-selector" style="width: 100%; background-color: black; color: white; padding: 5px">
        <option value="classic">SERVER #1: 450,000 Movies and TV episodes, exclusive to Chatflix. Full HD, Captions, No Ads</option>
        <option value="beta">SERVER #2: Alternate Server - Full HD, No Ads</option>
    </select>
 
 
    <p>
                  <small><em>Always try Server #1 first, and if it doesn't work, try Server #2... Server #2 is is the backup in case of network issues</em></small>



  </p>
  </div>`
}
export {players, embedPlayer, getPlayerUrl, streamPicker}