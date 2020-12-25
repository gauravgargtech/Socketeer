var base64 = require("base-64");
var utf8 = require("utf8");
const rabbit = require("../adapters/rabbitmq");
const redisClient = require("../adapters/redis");
var fs = require("fs");
const axios = require("axios").default;
const FormData = require("form-data");
const config = require('../config/keys');

module.exports = {
  saveCommandsInRedis: async () => {
    let clientId = 12; //req.session.userId;

    let allCommands = await commandsModel.findAll({
      attributes: ["command", "action"],
      where: {
        fk_client: clientId,
        status: {
          [Op.gt]: -1,
        },
      },
    });
    console.log(allCommands);
    await redisClient.set("commands_" + clientId, JSON.stringify(allCommands));
  },

  encrypt: (text) => {
    var bytes = utf8.encode(text);
    return base64.encode(bytes);
  },

  decrypt: (text) => {
    return base64.decode(text);
  },

  fetchCommands: (appId) => {
    return new Promise((resolve, reject) => {
      redisClient.get("commands_" + appId, (err, allCommands) => {
        resolve(JSON.parse(allCommands));
      });
    });
  },
  fetchHotword: (appId) => {
    return new Promise((resolve, reject) => {
      redisClient.get("hotword_" + appId, (err, hotword) => {
        resolve(hotword);
      });
    });
  },

  fetchSpeechFromBlob: async (msg, fileName) => {
    const appID = msg.appId;

    fs.writeFileSync(fileName, Buffer.from(new Uint8Array(msg.blobData)));

    const formData = new FormData();

    formData.append("audio_file", fs.createReadStream(fileName));
    const res = await axios.post(config.sttHost, formData, {
      headers: formData.getHeaders(),
    });
    var speech = JSON.parse(res.data.partial);
    console.log(speech);
    return speech;
  },
};
