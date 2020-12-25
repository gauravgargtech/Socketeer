var base64 = require("base-64");
var utf8 = require("utf8");
const rabbit = require("../adapters/rabbitmq");
const redisClient = require("../adapters/redis");

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
        console.log(hotword);
        resolve(hotword);
      });
    });
  },
};
