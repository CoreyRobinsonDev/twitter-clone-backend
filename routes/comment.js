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
    
    res.send(rows);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/repost", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { user_id, post_id } = req.body;

  db.all("SELECT * FROM reposts WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    if (rows.length === 0) {
      db.run("INSERT INTO reposts (user_id, post_id) VALUES(?, ?)", [user_id, post_id], (err) => {
        if (err) return res.status(500).send("Server Error");
         db.all("SELECT num_reposts FROM posts WHERE id = ?", [post_id], (err, repostsRow) => {
          if (err) return res.status(500).send("Server Error");
          
          const reposts = repostsRow[0].num_reposts;
          
          db.run("UPDATE posts SET num_reposts = ? WHERE id = ?", [reposts + 1, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");

            res.send("Success");
          })
        })
      })    
    } else {
      db.run("DELETE FROM reposts WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err) => {
        if (err) return res.status(500).send("Server Error");

        db.all("SELECT num_reposts FROM posts WHERE id = ?", [post_id], (err, repostsRow) => {
          if (err) return res.status(500).send("Server Error");

          const reposts = repostsRow[0].num_reposts;

          db.run("UPDATE posts SET num_reposts = ? WHERE id = ?", [reposts - 1, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");

            res.send("Success");
          })
        })
      })       
    }
  })
  
  db.close((err) => {
    if (err) return console.error(err)
  })
});


router.post("/upvote", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { user_id, post_id } = req.body;

  db.all("SELECT * FROM upvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    if (rows.length === 0) {
      db.all("SELECT * FROM downvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, result) => {
      if (err) return res.status(500).send("Server Error");

        if (result.length === 0) {

          db.run("INSERT INTO upvotes (user_id, post_id) VALUES(?, ?)", [user_id, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");
            
            db.all("SELECT num_upvotes FROM posts WHERE id = ?", [post_id], (err, upvoteRows) => {
              if (err) return res.status(500).send("Server Error");
              
              const upvotes = upvoteRows[0].num_upvotes;
          
              db.run("UPDATE posts SET num_upvotes = ? WHERE id = ?", [upvotes + 1, post_id], (err) => {
                if (err) return res.status(500).send("Server Error");
            
                res.send(true)
              })
            })
          })
        } else {
          res.send(false);
        }
      })
    } else {
      db.run("DELETE FROM upvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err) => {
        if (err) return res.status(500).send("Server Error");
        
        db.all("SELECT num_upvotes FROM posts WHERE id = ?", [post_id], (err, upvoteRows) => {
          if (err) return res.status(500).send("Server Error");

          const upvotes = upvoteRows[0].num_upvotes;
          
          db.run("UPDATE posts SET num_upvotes = ? WHERE id = ?", [upvotes - 1, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");
            
            res.send(false)
          })
        })
      })
    }

  })

  db.close((err) => {
    if (err) return console.error(err)
  })
});


router.post("/downvote", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { user_id, post_id } = req.body;

  db.all("SELECT * FROM downvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    if (rows.length === 0) {
      db.all("SELECT * FROM upvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, result) => {
        if (err) return res.status(500).send("Server Error");

        if (result.length === 0) {

          db.run("INSERT INTO downvotes (user_id, post_id) VALUES(?, ?)", [user_id, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");
        
            db.all("SELECT num_downvotes FROM posts WHERE id = ?", [post_id], (err, downvoteRows) => {
              if (err) return res.status(500).send("Server Error");

              const downvotes = downvoteRows[0].num_downvotes;

              db.run("UPDATE posts SET num_downvotes = ? WHERE id = ?", [downvotes + 1, post_id], (err) => {
                if (err) return res.status(500).send("Server Error");
            
                res.send(true)
              })
            })
          })
        } else {
          res.send(false);
        }
      })
    } else {
      db.run("DELETE FROM downvotes WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err) => {
        if (err) return res.status(500).send("Server Error");
        
        db.all("SELECT num_downvotes FROM posts WHERE id = ?", [post_id], (err, downvoteRows) => {
          if (err) return res.status(500).send("Server Error");

          const downvotes = downvoteRows[0].num_downvotes;

          db.run("UPDATE posts SET num_downvotes = ? WHERE id = ?", [downvotes - 1, post_id], (err) => {
            if (err) return res.status(500).send("Server Error");
            
            res.send(false)
          })
        })
      })
    }

  })

  db.close((err) => {
    if (err) return console.error(err)
  })
});

module.exports = router;