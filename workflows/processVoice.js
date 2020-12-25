const redisClient = require("../adapters/redis");
var fs = require("fs");
const axios = require("axios").default;
const common = require("../common/functions");
var natural = require("natural");
const rabbitPublish = require("../adapters/rabbitmq");
const FormData = require("form-data");
const request = require("request");

const voiceProcessor = {
  processVoice: async (msg, ws) => {
    let appId = msg.appId;
    let f = Math.floor(Math.random() * 100);
    let fileName = `./audios/hello_${f}.wav`;

    let speech = await voiceProcessor.fetchSpeechFromBlob(msg, fileName);
    console.log("-this is speech");
    console.log(speech);

    if (msg.isHotword) {
      common.fetchHotword(appId).then((hotword) => {
        voiceProcessor.processHotWord(hotword, speech, ws);
      });
    }

    //fs.unlink(fileName);

    return;
  },

  processHotWord: (hotword, speech, ws) => {
    if (voiceProcessor.isHotword(hotword, speech)) {
      var validCommands = [];
      common.fetchCommands(appId).then((commandsObj) => {
        for (key in commandsObj) {
          validCommands.push(commandsObj[key].command);
        }
        ws.send(
          JSON.stringify({
            commandType: "hotWords",
            action: "openWidget",
            messages: validCommands,
          })
        );

        rabbitPublish("hotwords", {
          appId: msg.appId,
          score: score,
        });
      });
    }
  },
  isHotWord: (hotword, speech) => {
    let isHotword = false;
    let score = natural.JaroWinklerDistance(hotword, speech.partial);
    if (score * 100 > 70) {
      isHotword = true;
    }
    return isHotword;
  },

  fetchSpeechFromBlob: async (msg, fileName) => {
    const appID = msg.appId;

    console.log(msg);
    fs.writeFileSync(fileName, Buffer.from(new Uint8Array(msg.blobData)));

    const formData = new FormData();

    console.log(fileName);

    formData.append("audio_file", fs.createReadStream(fileName));
    const res = await axios.post("http://localhost:5001", formData, {
      headers: formData.getHeaders(),
    });
    var speech = JSON.parse(res.data.partial);
    console.log(speech);
    return speech;
  },
};

module.exports = voiceProcessor;
