
// given the CSS selector of the share button in the UI, and the information to be shared,
// binds the share button to the share functionality. 
// this code is bleeding edge, and serves to directly integrate the sharing utensil 
// in the UI, with the OS-specific sharing functionality... so on mobile, you get a 
// nice android or iOS share sheet with a list of target apps able to handle the kind of 
// content being shared. On desktop, behavior varies depending on the browser and OS.
//
// our testing has revealed as follows:
// - Chrome on Windows 11: works, but buggy... Only the URL is shared (not title or text), and only microsoft products are available as target apps. You can of course pick the "copy to clipboard" option so its still better than no share button at all
// - Edge on Windows 11: works perfectly... pops a share sheet with icons for FB, Twitter, Linkedin, etc... and then perfectly forwards on the data to the sharing dialogs for those webapps.
// - Chrome on Android 13: works perfectly
// - Chrome on iOS: ? 
// - Safari on iOS: ?
// - Chrome on macOS: ?
// - Safari on macOS: don't know, don't care
import './jquery.js';


//generates a share button that shares structured content via the OS share sheet
//this lets your web pages trigger a share event that feels like it came from an app
//note that a HUMAN must click the share button in order to trigger the share sheet...
//automated clicking or otherwise calling navigator.share will fail (unless you're using an external automation tool like Puppeteer)
const shareButton = (title, text, url, target_selector,  button_style="icon_with_text") => { 
    let markup = ''
    if (button_style="icon_with_text") {
        markup= `
        <a href="#">
            <i class="fas fa-share"></i> Share
        </a>
        `
    }

    $(target_selector).append(markup)
    $(".share-button").on("click", (e) => {
        e.preventDefault()
        //the text share is buggy, so let the OG tags handle it
        navigator.share({title, text, url});
    })
    console.log("[debug] using deep OS integration for sharing")
    console.log("[debug] sharing metadata for page: ", JSON.stringify({title, text, url}, null, 2))
}

// example: shareButton(".share-button", "Mozilla Dev Network", "MDN is a refreshing alternative to the AI-generated content typical for this genre of front end dev articles", "https://mdn.io");
export {shareButton}