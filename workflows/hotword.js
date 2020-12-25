const redisClient = require("../adapters/redis");
const rabbitPublish = require("../adapters/rabbitmq");

module.exports = {
  getHotWord: (message, client) => {
    let appId = message.appId;
    return new Promise((resolve, reject) => {
      redisClient.get("hotword_" + appId, (err, hotword) => {
        if (err) {
          console.log(err);
        }
        if (hotword) {
          client.emit("showHotwords", {
            commandType: "hotwords",
            messages: `Say "${hotword}"`,
          });
          rabbitPublish("connections", {
            appId: appId,
          });

          resolve(hotword);
        }
      });
    });
  },
};
