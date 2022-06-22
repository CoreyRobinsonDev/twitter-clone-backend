const axios = require("axios");
const bcrypt = require("bcrypt");



exports.generate_user = async () => {
  const sqlite3 = require("sqlite3").verbose();
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message)
  })

   await axios.get("https://random-data-api.com/api/users/random_user")
  .then(async (response) => {
    const { username, password, avatar } = response.data;
    const date = new Date().toLocaleDateString("en-US");
    const hash = await bcrypt.hash(password, 10);
    
    db.run("INSERT INTO users (username, password, profile_photo, num_tweets, num_followers, num_following, date_acc_created, banner_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [username, hash, avatar, 0, 0, 0, date, "images/default_banner.jpg"], (err) => {
      if (err) return console.error(err);
    })
  })
  .catch(error => {
    if (error) return console.error(error)
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
}


exports.generate_post = async () => {
  const sqlite3 = require("sqlite3").verbose();
  const db = new sqlite3.Database("./database/bitter.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message)
  })
  const now = new Date();
  let post = {time: Math.floor(now / 1000)};

  await axios.get("https://random-data-api.com/api/lorem_ipsum/random_lorem_ipsum")
    .then(response => {
      const { very_long_sentence, short_sentence, question, word } = response.data;
      const text_arr = [very_long_sentence, short_sentence, question, word, ""];
      post.text = text_arr[Math.floor(Math.random() * text_arr.length)];
    })
    .catch(error => {
      if (error) return console.error(error);
    })
  await axios.get("https://random-data-api.com/api/lorem_flickr/random_lorem_flickr")
    .then(response => {
      const { image, image_50_60, image_500_500, image_1920_1080 } = response.data;
      const img_arr = [image, image_1920_1080, image_500_500, image_50_60, ""];

      post.media = img_arr[Math.floor(Math.random() * img_arr.length)];
    })
    .catch(error => {
      if (error) return console.error(error);
    })
  
  db.run("INSERT INTO posts (poster_id, text, media, num_comments, num_upvotes, num_downvotes, num_reposts, date_post_created) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [Math.floor(Math.random() * 1000), post.text, post.media, 0, 0, 0, 0, post.time], err => {
    if (err) return console.error(err);
  })

  db.close((err) => {
    if (err) return console.error(err)
  })
}