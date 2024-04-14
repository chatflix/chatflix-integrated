function getPremiumMembershipStatus(fromServer) {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) return false //must be logged in to have a membership!
  if (user.membership_status == 'VALID' || user.membership_status == 'TRIAL') {
    return true
  } else {
    return false
  }
}
function isLoggedIn() {
  // Example: Check for a token in local storage
  return localStorage.getItem('userId') !== null;
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem('user'))
}

function getAffiliateSummary() {
  return JSON.parse(localStorage.getItem('affiliate_info'))
}
function refreshUserProfile(callback) {
  if (isLoggedIn()) {
    const uid = window.localStorage.getItem('userId')
    $.get('/api/user/getUpdatedMemberProfile?userId='+ uid, (profile) => {
      localStorage.setItem('user', JSON.stringify(profile.user))
      localStorage.setItem('affiliate_info', JSON.stringify(profile.affiliate_info))
      console.log(JSON.stringify(profile, null, 2))
      if (callback) callback(profile)
    })
  } else {
    if (callback) callback(null)
  }
}
function login(email, password, redirectTo, useTop, callback) {
   $("#error-message").hide()
    $.ajax( 
    {
      url: `/api/user/login?email=${email}&password=${password}`,
      success: (user)  => {
        localStorage.setItem('user', JSON.stringify(user.user, null, 2))
        localStorage.setItem('affiliate_info', JSON.stringify(user.affiliate_info, null, 2))
        localStorage.setItem('userId', user.user.id)
        console.log(JSON.stringify(user, null, 2))

        if (redirectTo) {
          if (!useTop)
              window.location.href=redirectTo
          else 
            top.location.href=redirectTo
        } else {
            if (!useTop) window.location.reload() 
            else top.location.reload()
        }
      
        if (callback)
          callback(user)
      },
      error: (err) => { console.log(err), $('#error-message').html('Wrong email or password... Please try again').show();}
  })
  return false;

}
  
function logout(redirectTo, useTop=false) {
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('affiliate_info')
      if (redirectTo) {
          if (!useTop)
              window.location.href=redirectTo
          else 
          top.location.href=redirectTo
      } else {
          if (!useTop) window.location.reload() 
          else top.location.reload()
      }
  }