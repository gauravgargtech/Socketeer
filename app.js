var express = require("express");
var app = express();
var fs = require("fs");
const axios = require("axios").default;
var natural = require("natural");
const redisClient = require("./adapters/redis");

var Buffer = require("buffer/").Buffer;
const FormData = require("form-data");
const _ = require("lodash");
var cors = require("cors");
const rabbitPublish = require("./adapters/rabbitmq");

const uws = require("uWebSockets.js");
const BSON = require("bson");
const hotwordFlow = require("./workflows/hotword");
const processVoiceFlow = require("./workflows/processVoice");

const PORT = 4000;

app.use(express.static("public"));

var connectedSockets = [];

const apps = uws
  .App({})
  .ws("*", {
    /* Options */
    compression: uws.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 1000,
    /* Handlers */
    open: (ws) => {
      console.log("A WebSocket connected!");
      console.log(ws);
    },
    message: (ws, message, isBinary) => {
      try {
        console.log(message);
        console.log(typeof message);
        
        return;
        let incomingMessage = BSON.deserialize(message);

        console.log(incomingMessage);


        if (!_.has(incomingMessage, "appId")) {
          return false;
        }

        switch (incomingMessage.dataType) {
          case "getHotword":
            console.log("calls");
            hotwordFlow.getHotWord(incomingMessage, ws).then((hotword) => {});
            break;
          case "sendVoice":
            console.log("voice got");
            let v = new Buffer.from(incomingMessage.blobData, "binary");

            console.log(v);
            console.log(BSON.deserialize(incomingMessage.blobData));
            processVoiceFlow.processVoice(incomingMessage);
            console.log(incomingMessage);
            break;
        }
      } catch (err) {
        console.log(err);
        return;
      }
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log("WebSocket closed");
    },
  })
  .any("/*", (res, req) => {
    res.end("Area restricted!");
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log("Listening to port " + PORT);
    } else {
      console.log("Failed to listen to port " + PORT);
    }
  });

//app.use(cors());

//io.set('origins', '*:*');
//io.origins("*:*");
//io.set('origins', 'https://addvoice.com.au');
/*
wss.on("connection", function connection(client) {
  client.on("getHotword", (msg) => {
    let appId = msg.appId;
    redisClient.get("hotword_" + appId, (err, hotword) => {
      if (hotword) {
        client.emit("showHotwords", {
          commandType: "hotwords",
          messages: `Say "${hotword}"`,
        });
      }
    });

    rabbitPublish("connections", {
      appId: msg.appId,
    });
  }),
    client.on("message", async (msg) => {
      if (!_.has(msg, "appId")) {
        return false;
      }

      var f = Math.floor(Math.random() * 100);
      const appID = msg.appId;

      var fileName = `./audios/hello_${f}.wav`;

      fs.writeFileSync(fileName, Buffer.from(new Uint8Array(msg.blobData)));

      const formData = new FormData();

      formData.append("audio_file", fs.createReadStream(fileName));
      const res = await axios.post("http://localhost:5001", formData, {
        headers: formData.getHeaders(),
      });

      var speech = JSON.parse(res.data.partial);

      redisClient.get("commands_" + msg.appId, (err, allCommands) => {
        var commandsObj = JSON.parse(allCommands);

        if (!connectedSockets.includes(client.id)) {
          const hotword = redisClient.get("hotword_" + appID, (err, word) => {
            let score = natural.JaroWinklerDistance(word, speech.partial);

            if (score * 100 > 70) {
              var validCommands = [];
              for (key in commandsObj) {
                validCommands.push(commandsObj[key].command);
              }

              client.emit("event", {
                commandType: "hotword",
                action: "openWidget",
                messages: validCommands,
              });
              connectedSockets.push(client.id);
              fs.unlinkSync(fileName);
              rabbitPublish("hotwords", {
                appId: msg.appId,
                score: score,
              });

              return;
            } else {
              fs.unlinkSync(fileName);
              return;
            }
          });
        } else {
          var scoring = [];
          var matchedCommand = "";
          var redirect = "";

          var matchedScore = 0;
          for (key in commandsObj) {
            let score = natural.JaroWinklerDistance(
              commandsObj[key].command,
              speech.partial
            );
            scoring.push({
              word: commandsObj[key].command,
              score: score,
            });

            if (score * 100 > 55 && score > matchedScore) {
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
              appId: msg.appId,
              speech: speech.partial,
              action: redirect,
              score: matchedScore,
            });
          }
          connectedSockets[client.id] = null;
          fs.unlinkSync(fileName);
        }
        //fs.unlinkSync(fileName);
      });
    });
});
*/
console.log("Server running at http://127.0.0.1:4000/");
