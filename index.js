const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // args: error, destination
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({origin: "http://localhost:3000", credentials: true}))
app.use(express.json());
app.use(session({
  secret: "secretcode",
  resave: true,
  saveUninitialized: true
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
require("./util/passportConfig")(passport);
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
app.use("/images", express.static("images"))


// Routes
app.get("/", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const url = "http://localhost:4001/";

  db.all("SELECT posts.id, text, media, media_content_type, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts, username, profile_photo FROM posts JOIN users ON users.id = posts.poster_id ORDER BY posts.date_post_created DESC LIMIT 30", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    const posts = rows.map(row => {
     return {...row, media: url + row.media};
    })
    res.send(posts)
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


app.post("/register", async (req, res) => {
  const { password, confirmPassword } = req.body;
  const username = req.body.username.trim();
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  db.all("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) console.log(err);
    if (err)  return res.status(500).send("Server Error");
    if (row.length > 0) return res.status(404).send("User Already Exists");
  })

  
  const hash = await bcrypt.hash(password, 10);
  const date = new Date().toLocaleDateString("en-US");
  
  // Checks if a error occured in the database lookup and exits the function
  if (res.statusCode !== 200) return
  if (password !== confirmPassword) return res.status(403).send("Passwords Don't Match")
  
  db.run("INSERT INTO users (username, password, num_tweets, num_followers, num_following, date_acc_created, profile_photo, banner_photo) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [username, hash, 0, 0, 0, date, "images/default_pfp.webp", "images/default_banner.jpg"], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Server Error");
    }

    res.status(201).send("Account Created");
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})
  

app.post("/login", passport.authenticate("local"), (req, res) => {
  res.status(200).send(req.user);
  console.log(req.user);
})

 
app.post("/logout", (req, res) => {

  // Won't work without a callback function
  req.logout(() => {});
  res.status(200).send("Success");
})


app.get("/user", (req, res) => {
  res.send(req.user);
})


app.post("/post", upload.single("file"), (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  const { text, date, poster_id } = req.body;
  const media = req.file ? req.file.path : null;
  const mediaType = req.file ? req.file.mimetype : null;
  console.log(req.file, req.body, media)
  
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

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))