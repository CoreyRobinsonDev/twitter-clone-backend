const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

app.use(cors())


const PORT = 4001;


app.get("/", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  
  db.all("SELECT text, media, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts, username, profile_photo FROM posts JOIN users ON users.id = posts.poster_id LIMIT 30", [], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.send(rows)
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))