const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
})

db.all("SELECT * FROM posts", [], (err, rows) => {
  if (err) console.log(err)

  rows.forEach(row => console.log(row))
})

db.close((err) => {
  if (err) return console.error(err)
})