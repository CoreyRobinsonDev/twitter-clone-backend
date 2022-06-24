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
    if (err) {
      console.log(err);
      return res.status(500).send("Server Error");
    }
    res.status(201).send("Post Created");    
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
  const data = {
    post: {},
    user: {}
  }

  db.all("SELECT * FROM posts WHERE id = ?", [id], (err, rows) => {
   if (err) return res.status(500).json(err);
  
    rows.forEach(row => {
      data.post = {...row, media: url + row.media};
      db.all("SELECT username, profile_photo FROM users WHERE id = ?", [row.poster_id], (err, rows) => {
       if (err) return res.status(500).json(err);
      
        rows.forEach(row => {
          data.user = {...row, profile_photo: url + row.profile_photo};
          res.send(data)
        })
      })
    })
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/repost", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
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

});



module.exports = router;