const axios = require("axios");
const fs = require("fs");

let data;

axios.get("https://www.reddit.com/r/all.json")
  .then((response) => {

    // fs.writeFile("data.json", JSON.stringify(response.data), function(err) {
    //   if (err) return console.log(err);
    // })
  })

