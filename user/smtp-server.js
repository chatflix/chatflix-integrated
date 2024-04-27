const { SMTPServer } = require('smtp-server');

function startMailServer() {
    const server = new SMTPServer({
        onData(stream, session, callback) {
            stream.pipe(process.stdout); // This will print the email content to the console.
            stream.on('end', callback);
        },
        onAuth(auth, session, callback) {
            if (auth.username !== "chatflix" || auth.password !== "KillerApp123ZT") {
                return callback(new Error('Invalid username or password'));
            }
            callback(null, { user: auth.username }); // Authenticated
        }
    });

    // Listen only on localhost, port 25
    server.listen(25, '127.0.0.1', () => {
        console.log('SMTP Server listening on localhost port 25');
    });
}

module.exports = { startMailServer };
