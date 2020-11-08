var express = require("express");
var app = express();
var fs = require("fs");
const axios = require("axios").default;
var natural = require("natural");
const redisClient = require("./adapters/redis");

var Buffer = require("buffer/").Buffer;
const FormData = require("form-data");
const _ = require("lodash");
var cors = require('cors');

const PORT = 4000;

app.use(express.static("public"));

var connectedSockets = [];
//app.use(cors());

const writeConnections = fs.createWriteStream("soocketconnections.txt", {
  flags: "a",
});

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
var io = require("socket.io").listen(server);
//io.set('origins', '*:*');
//io.origins('*:*');
//io.set('origins', 'https://addvoice.com.au');
io.origins((origin, callback) => {
  if (origin !== 'https://addvoice.com.au') {
      return callback('origin not allowed', false);
  }
  callback(null, true);
});

io.sockets.on("connection", function (client) {
  writeConnections.write("Socket connected-" + client.id);
  client.on("disconnect", function () {
    console.log("connection droped");
  });

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

          for (key in commandsObj) {
            let score = natural.JaroWinklerDistance(
              commandsObj[key].command,
              speech.partial
            );
            scoring.push({
              word: commandsObj[key].command,
              score: score,
            });

            if (score * 100 > 65 && redirect == "") {
              matchedCommand = commandsObj[key].command;
              redirect = commandsObj[key].action;
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
          }
          connectedSockets[client.id] = null;
        }
        fs.unlinkSync(fileName);
      });
    });
});

console.log("Server running at http://127.0.0.1:4000/");
