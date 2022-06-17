const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message)
  console.log("Connection Successful")
})



const main = async () => { 

  db.all("SELECT username FROM users", [], (err, data) => {
    console.log(data)
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
}  

main();