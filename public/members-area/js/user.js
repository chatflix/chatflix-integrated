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

  function login(email, password, callback) {
    $.get(`/api/user/login?email=${email}&password=${password}`, (user) => {
      localStorage.setItem('user', JSON.stringify(user.user, null, 2))
      localStorage.setItem('affiliate_info', JSON.stringify(user.affiliate_info, null, 2))

      localStorage.setItem('userId', user.user.id)

      console.log(JSON.stringify(user, null, 2))
      callback(user)
    })
  }

  function signup(email, password, referralCode) {
    $.get(`/api/user/signup?email=${email}&password=${password}&referralCode=${referralCode}`, () => {
          login(email, password, () => {location.href='dashboard.html'})
    })
  }

