// affiliate.js

// 1. Check for referral code on page load and save to local storage
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
  
    if (referralCode) {
      localStorage.setItem('referralCode', referralCode);
      console.log('Referral code saved:', referralCode);
      tryTrackClick(referralCode)
    }
  });
  
  // 2. Get referral code from local storage
  function getReferralCodeFromLocalStorage() {
    var referralCode = localStorage.getItem('referralCode');
    console.log('Retrieved referral code:', referralCode || 'N/A');

    if (!referralCode) 
    {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
    
    }
     
    return referralCode || '';
  }
  
  // 3. Generate affiliate link with referral code
  function getAffiliateLink(originalUrl, referralCode) {
    const url = new URL(originalUrl);
    const params = new URLSearchParams(url.search);
  
    // Replace existing referral code or add new one
    params.set('ref', referralCode);
    url.search = params.toString();
  
    return url.toString();
  }
  
  //pings the counter to update stats for the referring partyh
  function tryTrackClick(referralId) {
    $.get("/api/user/record_click/"+referralId, (result) => console.log(JSON.stringify(result)))
  }