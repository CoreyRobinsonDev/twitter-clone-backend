const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const url = "https://not-twitter-crd.herokuapp.com/";

router.get("/", (req, res) => {
  const user = req.user ?? null;
  if (user) res.send({...user, profile_photo: url + user.profile_photo, banner_photo: url + user.banner_photo});
})


router.post("/getAllUserData", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  
  const { user_id } = req.body;

  db.all("SELECT username, profile_photo, banner_photo, num_tweets, num_following, num_followers, date_acc_created, bio FROM users WHERE id = ?", [user_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    rows[0].profile_photo = url + rows[0].profile_photo;
    rows[0].banner_photo = url + rows[0].banner_photo;
    
    res.send(rows[0]);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})

router.post("/follow", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { user_id, follower_id } = req.body;

  db.all("SELECT * FROM followers WHERE user_id = ? AND follower_id = ?", [user_id, follower_id], (err, row) => {
    if (err) return res.status(500).send("Server Error1");
    if (row.length !== 0) return res.send("User Already Following.");

    db.run("INSERT INTO followers (user_id, follower_id) VALUES(?, ?)", [user_id, follower_id], (err) => {
      if (err) return res.status(500).send("Server Error2");

      db.all("SELECT num_following FROM users WHERE id = ?", [follower_id], (err, followingRow) => {
        if (err) return res.status(500).send("Server Error3");
        const following = followingRow[0].num_following;

        db.run("UPDATE users SET num_following = ? WHERE id = ?", [following + 1, follower_id], (err) => {
          if (err) return res.status(500).send("Server Error4");

          db.all("SELECT num_followers FROM users WHERE id = ?", [user_id], (err, followerRow) => {
            if (err) return res.status(500).send("Server Error5");
            const followers = followerRow[0].num_followers;

            db.run("UPDATE users SET num_followers = ? WHERE id = ?", [followers + 1, user_id], (err) => {
              if (err) return res.status(500).send("Server Error6");

              res.send("Followed")
            })
          })
        })
      })
    })
  })
  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/unfollow", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { user_id, follower_id } = req.body;

  db.all("SELECT * FROM followers WHERE user_id = ? AND follower_id = ?", [user_id, follower_id], (err, row) => {
    if (err) return res.status(500).send("Server Error");
    if (row.length === 0) return res.send("Not Following");

    db.run("DELETE FROM followers WHERE user_id = ? AND follower_id = ?", [user_id, follower_id], (err) => {
      if (err) return res.status(500).send("Server Error");

      db.all("SELECT num_following FROM users WHERE id = ?", [follower_id], (err, followingRow) => {
        if (err) return res.status(500).send("Server Error");
        const following = followingRow[0].num_following;

        db.run("UPDATE users SET num_following = ? WHERE id = ?", [following - 1, follower_id], (err) => {
          if (err) return res.status(500).send("Server Error");

          db.all("SELECT num_followers FROM users WHERE id = ?", [user_id], (err, followersRow) => {
            if (err) return res.status(500).send("Server Error");
            const followers = followersRow[0].num_followers;

            db.run("UPDATE users SET num_followers = ? WHERE id = ?", [followers - 1, user_id], (err) => {
              if (err) return res.status(500).send("Server Error");

              res.send("Unfollowed");
            })
          })
        })
      })
    })
  })
  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/getFollowers", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { user_id } = req.body;

  db.all("SELECT follower_id FROM followers WHERE user_id = ?", [user_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");
    const followers = rows.map(row => row.follower_id);
    
    res.send(followers);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/getFollowing", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { follower_id } = req.body;

  db.all("SELECT user_id FROM followers WHERE follower_id = ?", [follower_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");
    const following = rows.map(row => row.user_id);
    
    res.send(following);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


router.post("/getIdByUsername", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  const { username } = req.body;

  db.all("SELECT id FROM users WHERE username LIKE ?", [`%${username}%`], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    const ids = rows.map(row => row.id);
    console.log(ids)
    res.send(ids);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
})


module.exports = router;