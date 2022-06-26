const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
})


db.run("CREATE TABLE bookmarks (user_id INTEGER NOT NULL, post_id INTEGER, comment_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(post_id) REFERENCES posts(id), FOREIGN KEY(comment_id) REFERENCES comment_section(id))", err => {if  (err) console.error(err)})


db.close((err) => {
  if (err) return console.error(err)
})