const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
})


db.run("UPDATE posts SET num_comments = 0 WHERE id = 103")


db.close((err) => {
  if (err) return console.error(err)
})