var fs = require("fs");
const common = require("../common/functions");
var natural = require("natural");
const rabbitPublish = require("../adapters/rabbitmq");
const _ = require("lodash");
const config = require("../config/keys");

const processVoice = {
  processSpeech: async (msg, client) => {
    let appId = msg.appId;
    let f = Math.floor(Math.random() * 100);
    let fileName = `./audios/hello_${f}.wav`;

    let speech = await common.fetchSpeechFromBlob(msg, fileName);

    common.fetchCommands(appId).then((commandsObj) => {
      processVoice.calculateCommandScores(commandsObj, client, speech, appId);
    });

    fs.unlink(fileName, () => {});
    return;
  },

  calculateCommandScores: (commandsObj, client, speech, appId) => {
    let scoring = [];
    let matchedCommand = "";
    let redirect = "";

    let matchedScore = 0;
    for (key in commandsObj) {
      let score = natural.JaroWinklerDistance(
        commandsObj[key].command,
        speech.partial
      );
      scoring.push({
        word: commandsObj[key].command,
        score: score,
      });

      if (score * 100 > config.commandMatchScore && score > matchedScore) {
        matchedCommand = commandsObj[key].command;
        redirect = commandsObj[key].action;
        matchedScore = score;
      }
    }
    if (!_.isEmpty(matchedCommand)) {

      client.emit("event", {
        commandType: "instruction",
        action: "redirect",
        redirect: redirect,
        userSpeeech: speech.partial,
        matchedCommand: matchedCommand,
        scores: scoring,
      });

      rabbitPublish("speeches", {
        appId: appId,
        speech: speech.partial,
        action: redirect,
        score: matchedScore,
      });
    }
  },
};
module.exports = processVoice;
