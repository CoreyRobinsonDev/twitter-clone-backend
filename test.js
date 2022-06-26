const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
})


db.run("CREATE TABLE reposts (user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(post_id) REFERENCES posts(id))")


db.close((err) => {
  if (err) return console.error(err)
})