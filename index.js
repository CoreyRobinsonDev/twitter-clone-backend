const express = require("express");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");

const PORT = 4001;

// Middleware
app.use(cors({origin: "http://localhost:3000", credentials: true}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "secretcode",
  resave: true,
  saveUninitialized: true
}));
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./util/passportConfig")(passport);


// Routes
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


app.post("/register", async (req, res) => {
  const { password, confirmPassword } = req.body;
  const username = req.body.username.trim().toUpperCase();
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  db.all("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) console.log(err);
    if (err) return res.status(500).send("Server Error");
    if (row.length > 0) return res.status(404).send("User Already Exists");
  })

  if (password !== confirmPassword) return res.status(403).send("Password doesn't Match Confirmed Password")

  const hash = await bcrypt.hash(password, 10);
  const date = new Date().toLocaleDateString("en-US");
  
  db.run("INSERT INTO users (username, password, num_tweets, num_followers, num_following, date_acc_created) VALUES(?, ?, ?, ?, ?, ?)", [username, hash, 0, 0, 0, date], (err) => {
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


app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) {
      res.status(404).send("No User was Found");
    } else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.status(200).send("Successful");
        console.log(req.user);
      })
    }

  })(req, res, next)
})


app.get("/logout", (req, res) => {
  req.logout();
})


app.get("/user", (req, res) => {
  res.send(req.user);
})




app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))