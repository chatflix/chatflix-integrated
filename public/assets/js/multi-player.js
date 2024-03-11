const players = [{id: "classic", desc: "Server #1 - HD, No Ads, Original Chatflix Player"}, {id: "beta", desc: "[Beta] Server #2 - Enhanced Player w/Captions"}, {id: "alt", desc: "[Alternate] Server #3 - Best Captions, Some Ads"}]

const getPlayerUrl = (tmdbId, type="movie", player="classic") => {
    switch (player) {
        case "classic":
            return `/player/${type}/${tmdbId}?player=classic` //== legacy minus ads
        case "legacy": 
            return `https://vidsrc.to/embed/${type}/${tmdbId}`
        case "beta": 
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

export {players, embedPlayer, getPlayerUrl}