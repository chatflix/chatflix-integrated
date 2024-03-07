  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  const analytics = null
  const db = firebaseApp.firestore();
  const auth = firebaseApp.auth();
  var ui = new firebaseui.auth.AuthUI(auth);

  export {analytics, db, auth, ui}
