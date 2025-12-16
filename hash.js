const bcrypt = require("bcryptjs");

const password = "AEAN050403";

bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
});
