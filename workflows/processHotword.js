const redisClient = require("../adapters/redis");
var fs = require("fs");
const axios = require("axios").default;
const common = require("../common/functions");
var natural = require("natural");
const rabbitPublish = require("../adapters/rabbitmq");
const FormData = require("form-data");

const processHotword = {
  processWord: async (msg, client) => {
    let appId = msg.appId;
    let f = Math.floor(Math.random() * 100);
    let fileName = `./audios/hello_${f}.wav`;

    let speech = await common.fetchSpeechFromBlob(msg, fileName);

    if (msg.isHotword) {
      common.fetchHotword(appId).then((hotword) => {
        processHotword.processHotWord(appId, hotword, speech, client);
      });
    }

    fs.unlink(fileName, () => {});
    return;
  },

  processHotWord: (appId, hotword, speech, client) => {
    if (processHotword.isHotWord(hotword, speech)) {
      var validCommands = [];
      common.fetchCommands(appId).then((commandsObj) => {
        for (key in commandsObj) {
          validCommands.push(commandsObj[key].command);
        }

        client.emit("event", {
          commandType: "hotword",
          action: "openWidget",
          messages: validCommands,
        });
      });
    }
  },
  isHotWord: (hotword, speech) => {
    return true;
    let isHotword = false;
    let score = natural.JaroWinklerDistance(hotword, speech.partial);
    console.log("---score", score);
    if (score * 100 > 50) {
      isHotword = true;
    }
    rabbitPublish("hotwords", {
      appId: appId,
      score: score,
    });

    return isHotword;
  },
};

module.exports = processHotword;
