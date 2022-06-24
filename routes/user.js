const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const url = "http://localhost:4001/";

router.get("/", (req, res) => {
  res.send(req.user);
})

router.post("/getUserData", (req, res) => {
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
  })
  
  const { user_id } = req.body;

  db.all("SELECT username, profile_photo FROM users WHERE id = ?", [user_id], (err, rows) => {
    if (err) return res.status(500).send("Server Error");

    rows[0].profile_photo = url + rows[0].profile_photo;
    
    res.send(rows[0]);
  })

  
  db.close((err) => {
    if (err) return console.error(err)
  })
})

module.exports = router;