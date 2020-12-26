var fs = require("fs");
const common = require("../common/functions");
var natural = require("natural");
const rabbitPublish = require("../adapters/rabbitmq");
const config = require("../config/keys");
const meSpeak = require("mespeak");
const say = require("say");
let wav = require("node-wav");

const processHotword = {
  processWord: async (msg, client) => {
    let appId = msg.appId;

    if (typeof msg.forceShow != "undefined" && msg.forceShow) {
      processHotword.emitCommands(appId, client);
      return;
    }
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
    if (processHotword.isHotWord(hotword, speech, appId)) {
      processHotword.emitCommands(appId, client);
    }
  },

  emitCommands: (appId, client) => {
    var validCommands = [];
    common.fetchCommands(appId).then((commandsObj) => {
      for (key in commandsObj) {
        validCommands.push(commandsObj[key].command);
      }
      //processHotword.deliverSpeech(client);

      client.emit("event", {
        commandType: "hotword",
        action: "openWidget",
        messages: validCommands,
      });
    });
  },

  isHotWord: (hotword, speech, appId) => {
    let isHotword = false;
    let score = natural.JaroWinklerDistance(hotword, speech.partial);
    if (score * 100 >= config.hotwordMatchScore) {
      isHotword = true;
    }
    rabbitPublish("hotwords", {
      appId: appId,
      score: score,
    });

    return isHotword;
  },

  deliverSpeech: (client) => {
    console.log("inside speech");
    console.log(client.handshake.session.clientId);
    say.export(
      "Amaze your users with a unique experience. Increase sales and page views of your web application. Be the part of a revolution and connect with new audiences.",
      "Samantha",
      0.95,
      "hal.wav",
      (err) => {
        if (err) {
          return console.error(err);
        }
        console.log("Text has been saved to hal.wav.");
        let buffer = fs.readFileSync("hal.wav");
        console.log(client.handshake.session);

        client.broadcast.to(client.handshake.session.clientId).emit("event", {
          commandType: "speech",
          action: "deliverSpeech",
          message: buffer,
        });
        console.log("kkk");
      }
    );
    //    let speech = meSpeak.speak("A brand with a superior customer experience generates more revenue than a competitor that lags behind in customer experience.  This is a staggering statistic and certainly says it all, but the user experience is not a one-off. You need to constantly update and update your website layout and design to keep up", { rawdata: "buffer" });
  },
};

module.exports = processHotword;
