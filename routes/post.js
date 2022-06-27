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
    cb(null, "images/posts");
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

  const { text, date, poster_id } = req.body;
  const media = req.file ? req.file.path : null;
  const mediaType = req.file ? req.file.mimetype : null;
 
  
  db.run("INSERT INTO posts (poster_id, text, media, media_content_type, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [poster_id, text, media, mediaType, date, 0, 0, 0, 0], (err) => {
    if (err) return res.status(500).send("Server Error");
    
    db.all("SELECT num_tweets FROM users WHERE id = ?", [poster_id], (err, row) => {
      if (err) return res.status(500).send("Server Error");

      const tweets = row[0].num_tweets;

      db.run("UPDATE users SET num_tweets = ? WHERE id = ?", [tweets + 1, poster_id], (err) => {
        if (err) return res.status(500).send("Server Error");        

        res.status(201).send("Post Created");    
      })
    })


  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/getPostData", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { id } = req.body;
 
    db.all("SELECT posts.id, text, media, media_content_type, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts, username, profile_photo FROM posts JOIN users ON users.id = posts.poster_id WHERE posts.id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    
      const post = rows.map(row => {
        return {...row, media: url + row.media, profile_photo: url + row.profile_photo};
      })
  
      res.send(post)
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/repost", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const date = Math.floor(+ new Date() / 1000);
  const { user_id, post_id } = req.body;

  db.all("SELECT * FROM reposts WHERE user_id = ? AND post_id = ?", [user_id, post_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    if (rows.length === 0) {
      db.run("INSERT INTO reposts (user_id, post_id, date_reposted) VALUES(?, ?, ?)", [user_id, post_id, date], (err) => {
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





router.post("/getAllPostInteractions", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { id } = req.body;
  const data = {
    reposts: [],
    upvotes: [],
    downvotes: [],
    bookmarks: []
  }


  db.all("SELECT post_id FROM reposts WHERE user_id = ?", [id], (err, reposts) => {
    if (err) return res.status(500).send("Server Error");

    data.reposts = reposts.map(repost => repost.post_id)     

    db.all("SELECT post_id FROM upvotes WHERE user_id = ?", [id], (err, upvotes) => {
      if (err) return res.status(500).send("Server Error");

      data.upvotes = upvotes.map(upvote => upvote.post_id);     
      
      db.all("SELECT post_id FROM downvotes WHERE user_id = ?", [id], (err, downvotes) => {
        if (err) return res.status(500).send("Server Error");

        data.downvotes = downvotes.map(downvote => downvote.post_id);
        
        db.all("SELECT post_id FROM bookmarks WHERE user_id = ?", [id], (err, bookmarks) => {
          if (err) return res.status(500).send("Server Error");

          data.bookmarks = bookmarks.map(bookmark => bookmark.post_id);
          res.send(data);
        })
      })
    })
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
}) 

module.exports = router;