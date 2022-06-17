const bcrypt = require("bcrypt");
const axios = require("axios");

const generate_password_hash = async (password, salt_rounds = 10) => {
  try {
    const salt = await bcrypt.genSalt(salt_rounds);
    
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.log(err);
  }
  return null;
}

exports.generate_password_hash = generate_password_hash;

exports.generate_user = async () => {
   await axios.get("https://random-data-api.com/api/users/random_user")
  .then(response => {
    const { username, password, avatar } = response.data;
    const date = new Date().toLocaleDateString("en-US");
    
    db.run("INSERT INTO users (username, password, profile_photo, num_tweets, num_followers, num_following, date_acc_created) VALUES (?, ?, ?, ?, ?, ?, ?)", [username, generate_password_hash(password), avatar, 0, 0, 0, date], (err) => {
      if (err) return console.error(err);

    })
  })
  .catch(error => {
    if (error) return console.error(error)
  })
}