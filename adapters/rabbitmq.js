var amqp = require("amqplib/callback_api");

// if the connection is closed or fails to be established at all, we will reconnect
var amqpConn = null;
async function start() {
  await amqp.connect("amqp://localhost", function (err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
        return setTimeout(start, 1000);
      }
    });
    conn.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    console.log("[AMQP] connected");
    amqpConn = conn;
  });
}
start();
//var conn = require('amqplib').connect('amqp://localhost');

function rabbitPublish(queue, message) {
  try {
    amqpConn.createChannel(on_open);
    function on_open(err, ch) {
      if (err != null) bail(err);
      ch.assertQueue(queue, {
        durable: true,
      });
      ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
    }
  } catch (e) {
    console.error("[AMQP] publish", e.message);
  }
}

module.exports = rabbitPublish;

/*
amqpConn.createConfirmChannel(function (err, ch) {
    console.log("--err---");
    console.log(err);
    ch.on("error", function (err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function () {
      console.log("[AMQP] channel closed");
    });

    pubChannel = ch;
  });
function consumer(conn) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {
    if (err != null) bail(err);
    ch.assertQueue(q);
    ch.consume(q, function(msg) {
      if (msg !== null) {
        console.log(msg.content.toString());
        ch.ack(msg);
      }
    });
  }
}
  */
