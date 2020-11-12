var base64 = require("base-64");
var utf8 = require("utf8");
const rabbit = require("../adapters/rabbitmq");

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

};
