const express = require("express");
const app = express();
const fs = require("fs");
const _ = require("lodash");

const hotwordFlow = require("./workflows/hotword");
const processHotwordFlow = require("./workflows/processHotword");
const processVoiceFlow = require("./workflows/processVoice");

const PORT = 4000;

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
var io = require("socket.io").listen(server);
io.origins("*:*");

io.sockets.on("connection", function (client) {
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
});

console.log("Server running at http://127.0.0.1:4000/");
