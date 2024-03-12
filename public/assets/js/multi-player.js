const players = [{id: "classic", desc: "Server #1 - HD, No Ads, Original Chatflix Player"}, {id: "beta", desc: "[Beta] Server #2 - Enhanced Player w/Captions"}, {id: "alt", desc: "[Alternate] Server #3 - Best Captions, Some Ads"}]

const getPlayerUrl = (tmdbId, type="movie", player="classic") => {
    //about vidsrc URLs, to save you some time
    //there are two (at least) separate websites under the vidsrc brand: vidsrc.to, and vidsrc.me
    //vidsrc.me, vidsrc.net, vidsrc.in, vidsrc.xyz, and some others all link to the same website... 
    //while the website uses vidsrc.me as its primary domain, the docs on that site ask you NOT to use .me to embed videos
    //but they say that any of the others can be used for that purpose. anyways, we're using the vidsrc.net player, just because
    //we think its less sketchy for SEO purposes than a .xyz, but the player itself is identical

    //vidsrc.to, however, is its own thing... the embedded player at that domain is different than the multi-domain player above
    //the good thing about vidsrc.to is that they forgot to finish securing it, and they setup their CORS improperly
    //so originally we were using that player (which only exists in a free, ad-supported version), but proxying it via our server
    //and remove the ads. this worked fine... we ended up switching because vidsrc.to went down (unrelated to the ad removal) and 
    //then we discovered that vidsrc.me offered PREMIUM streams: $0.001 / movie or episode viewed, and for that price 
    //you get crisp HD video with no ads... and what's more, you get crisp AUDIO to go with your video

    //we were given a $1 promo code by the folks at vidsrc me to evaluate their content and their player 
    //and it appears they're not tracking view counts, based on the dashboard...

    //the ordering process is rather strange. in order to use the ad free streams, you have to tell them what your domain in 
    //(reasonable), and set the iframe to pass along that domain as referrer (reasonable), but then they tell you to 
    //verify the domain is actually yours, by putting an empty file with a weird name in your public html folder
    //(totally normal when applying for an SSL certificate, or setting up gmail for a domain you need to prove you own)
    //
    //so it gives me a tiny bit of concern... on the other hand, if they were criminals who were going to steal my domain, 
    //they would have just done it immediately. and they would not actually HAVE 450,000 high quality streams with no ads. 
    //their price is way too cheap. it makes me concerned as well that they're doing to someone else what i did to the 
    //vidsrc.to player, and these are not their streams at all, they just removed ads from some other player. 

    //well, the fact u click twice to play a video - the first click appears to navigate within the iframe to some other url 
    //that actually embeds the video... but that could be their own stuff, it would be too dangerous to release a genuinely ad free player
    //so instead they probably hacked their existing player to suppress ads with the javascript equivalent of a bullet trap
    
    //so far i'm extremely happy with vidsrc.me, and they told me to connect on telegram for support

    //maybe i can get them to fall in love with chatflix and invest in it. they're obvious wealthy if they're charging so little
    switch (player) {
  
          case "classic":
            return `https://vidsrc.net/embed/${type}/${tmdbId}`    
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


const streamPicker = () => {
    return `                <div>
    <select id="player-selector" style="width: 100%">
        <option value="classic">SERVER #1: 450,000 Movies and TV episodes, exclusive to Chatflix. Full HD, Captions, No Ads</option>
        <option value="beta">SERVER #2 (Backup): 12,000 Movies, 74,000 TV episodes, quality varies. Captions available. Ad-Supported.</option>
    </select>
 
 
    <p>
                  <small>SERVER #1 hosts top quality ad-free content exclusively for Chatflix and is the preferred option for most viewers. SERVER #2 is a public server with ads and lower quality streams. It is suggested you use this only when unable to connect to SERVER #1</small>

          <small style="display:none">SERVER #1 features over 450,000 streaming movies and TV episodes in full HD, no ads, and captions in 30 languages. SERVER #2 is a backup server that has ads and takes longer to load, therefore, always use SERVER #1 whenever possible. These are premium quality streams that are exclusive to Chatflix and you will not find these streams anywhere else on the Internet</small>

    <small style="display:none">By default, all movies and shows will be played in the default Chatflix Player with no ads and lightning fast speeds. If you need subtitles (in 33 languages) the alternate player is for you, however it has a few ads...</small>      


  </p>
  </div>`
}
export {players, embedPlayer, getPlayerUrl, streamPicker}