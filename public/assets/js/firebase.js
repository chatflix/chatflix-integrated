  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  const firebaseApp = window.firebase.initializeApp({
    apiKey: "AIzaSyDNo9Ik0kA28vW7hXH9MrGqNCJhjjcTP1c",
    authDomain: "chatflix-host.firebaseapp.com",
    projectId: "chatflix-host",
    storageBucket: "chatflix-host.appspot.com",
    messagingSenderId: "774020165138",
    appId: "1:774020165138:web:00ffe695ca3729bc3ab2cb",
    measurementId: "G-QZZN6ZQVH4"
  });
  const analytics = null
  const db = firebaseApp.firestore();
  const auth = null
  const ui = null

  //exporting null references so we don't break files that import them
  export {analytics, db, auth, ui}
