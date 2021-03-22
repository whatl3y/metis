const axios = require("axios");
const minimist = require("minimist");

const argv = minimist(process.argv.slice(2));

const baseURL = `http://localhost:4000`;

const login = (data) => {
  axios
    .post(`${baseURL}/appLogin`, data)
    // axios.post(${baseURL}/login, data)
    .then((response) => {
      console.log("\nRESPONSE2\n", response.data);
      // if (response.data.success) {
      //   console.log("success");
      //   console.log(response.data);
      // } else {
      //   console.log("error");
      // }
    })
    .catch((error) => {
      console.log("catch");
      console.log(error);
    });
};

const getJupiterAccount = ({ jupkey, encryptionPassword }) => {
  axios
    .post(`${baseURL}/get_jupiter_account`, {
      jup_passphrase: jupkey,
    })
    .then((response) => {
      console.log("\nRESPONSE\n", response.data);
      if (response.data.success) {
        login({
          account: response.data.account,
          accounthash: response.data.account,
          public_key: response.data.public_key,
          jupkey: jupkey,
          encryptionPassword: encryptionPassword,
        });
      } else {
        console.log("There was an error getting your account.");
        console.log("Error getting account", response.data);
      }
    })
    .catch((error) => {
      console.log("catch");
      console.log(error);
    });
};

getJupiterAccount({
  jupkey: argv.k || argv.key,
  encryptionPassword: argv.p || argv.password,
});
