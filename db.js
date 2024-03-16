const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('membership.db');

const init = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS membership_codes (
        code TEXT PRIMARY KEY,
        issue_date INTEGER,
        expiry_date INTEGER,
        transaction_id TEXT,
        has_been_used INTEGER
        )`);
    });
    
    db.close((err) => {
        if (err) {
        console.error(err);
        }
    });
}



db.close((err) => {
  if (err) {
    console.error(err);
  }
});
