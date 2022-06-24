const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const url = "http://localhost:4001/";


// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // args: error, destination
    cb(null, "images/comments");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20000000 // 20MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|webp|gif|mp4)$/)) { 
      // upload only png, jpeg, webp, gif, and mp4 format
      return cb(new Error('Please upload a Image'));
    }
    cb(undefined, true);
  }
});


// Routes
router.post("/", upload.single("file"), (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { poster_id, post_id, text } = req.body;
  const media = req.file ? req.file.path : null;

  db.run("INSERT INTO comment_section (poster_id, post_id, text, media, num_upvotes, num_downvotes, num_reposts) VALUES(?, ?, ?, ?, ?, ?, ?)", [poster_id, post_id, text, media, 0, 0, 0], (err) => {
    if (err) return res.status(500).send("Sever Error");

    db.all("SELECT num_comments FROM posts WHERE id = ?", [post_id], (err, rows) => {
      if (err) return res.status(500).send("Sever Error");

      const comments = rows[0].num_comments;

      db.run("UPDATE posts SET num_comments = ? WHERE id = ?", [comments + 1, post_id], (err) => {
        if (err) return res.status(500).send("Sever Error");

        res.status(201).send("Comment Created");
      })
    })
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
});


router.post("/getCommentData", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { post_id } = req.body;

  db.all("SELECT * FROM comment_section WHERE post_id = ?", [post_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    rows.forEach(row => row.media ? row.media = url + row.media : null);
    
    console.log(rows)
    res.send(rows);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})



module.exports = router;