const redisClient = require("../adapters/redis");
const rabbitPublish = require("../adapters/rabbitmq");

module.exports = {
  getHotWord: (message, ws) => {
    let appId = message.appId;
    return new Promise((resolve, reject) => {
      redisClient.get("hotword_" + appId, (err, hotword) => {
        if (err) {
          console.log(err);
        }
        if (hotword) {
          console.log(hotword);

          ws.send(
            JSON.stringify({
              commandType: "showHotwords",
              messages: `Say "${hotword}"`,
            })
          );
          rabbitPublish("connections", {
            appId: appId,
          });

          resolve(hotword);
        }
      });
    });
  },
};
