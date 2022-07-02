const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const url = "http://localhost:4001/";

router.get("/", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { id } = req.user;

  db.all("SELECT posts.id, poster_id, text, media, media_content_type, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts, username, profile_photo FROM posts JOIN users ON poster_id = users.id WHERE posts.id IN (SELECT post_id FROM bookmarks JOIN users ON user_id = users.id WHERE user_id = ?)", [id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    const bookmarks = rows.map(row => ({ ...row, media: url + row.media, profile_photo: url + row.profile_photo }));
    res.send(bookmarks);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})

module.exports = router;