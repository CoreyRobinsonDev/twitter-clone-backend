const bcrypt = require("bcrypt");
const localStrategy = require("passport-local").Strategy;

module.exports = function (passport) {
  const sqlite3 = require("sqlite3").verbose();
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })

  passport.use(
    new localStrategy((username, password, done) => {
      db.all("SELECT * FROM users WHERE username = ?", [username.trim()], (err, row) => {
        if (err) return done(err);
        if (row[0] === undefined) return done(null, false);
        const user = row[0];

        bcrypt.compare(password, user.password, (err, result) => {
          if (err) return done(err);

          if (result === true) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
      })
    })
  )

  passport.serializeUser((user, done) => {
    process.nextTick(() => {
      done(null, user.id);
    })
  })

  passport.deserializeUser((id, done) => {
    process.nextTick(() => {
      db.all("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) return done(err);
        done(null, row[0])
      })
    })
  })

}
