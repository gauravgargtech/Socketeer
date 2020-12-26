const express = require("express");
const app = express();
const fs = require("fs");
const _ = require("lodash");
const config = require("./config/keys");
const meSpeak = require("mespeak");

const hotwordFlow = require("./workflows/hotword");
const processHotwordFlow = require("./workflows/processHotword");
const processVoiceFlow = require("./workflows/processVoice");

var session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true,
});

var sharedsession = require("express-socket.io-session");

const PORT = config.port;

meSpeak.loadConfig(require("mespeak/src/mespeak_config.json"));
meSpeak.loadVoice(require("mespeak/voices/en/en-us.json"));

app.use(session);

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
var io = require("socket.io").listen(server);
io.origins("*:*");
io.use(
  sharedsession(session, {
    autoSave: true,
  })
);

io.sockets.on("connection", function (client) {

  client.handshake.session.clientId = client.id;
  client.handshake.session.save();

  client.on("getHotword", (msg) => {
    hotwordFlow.getHotWord(msg, client).then((hotword) => {});
  });

  client.on("message", async (msg) => {
    if (!_.has(msg, "appId")) {
      return false;
    }
    if (msg.isHotword) {
      processHotwordFlow.processWord(msg, client);
    } else {
      processVoiceFlow.processSpeech(msg, client);
    }
  });

  client.on("disconnect", function () {
    if (client.handshake.session.clientId) {
      delete client.handshake.session.clientId;
      client.handshake.session.save();
    }
  });
});

console.log("Server running at http://127.0.0.1:4000/");
