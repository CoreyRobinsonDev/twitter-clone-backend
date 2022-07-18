const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const url = "http://localhost:4001/";
require("dotenv").config();

const PORT = process.env.PORT || 4001;


// Middleware
app.use(cors({origin: "https://not-twitter-crd.netlify.app", credentials: true}))
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

app.use("/images", express.static("images"))



// Routes
app.get("/", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  
  db.all("SELECT posts.id, poster_id, text, media, media_content_type, date_post_created, num_comments, num_upvotes, num_downvotes, num_reposts, username, profile_photo FROM posts JOIN users ON users.id = posts.poster_id ORDER BY posts.date_post_created DESC LIMIT 30", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    const posts = rows.map(row => {
      return {...row, media: url + row.media, profile_photo: url + row.profile_photo};
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
})


app.post("/logout", (req, res) => {
  
  // Won't work without a callback function
  req.logout(() => {});
  res.status(200).send("Success");
})



const postRouter = require("./routes/post");
app.use("/post", postRouter);

const userRouter = require("./routes/user");
app.use("/user", userRouter);

const commentRouter = require("./routes/comment");
app.use("/comment", commentRouter);

const bookmarkRouter = require("./routes/bookmark");
app.use("/bookmark", bookmarkRouter);


app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));