const redis = require("redis-node");
const config = require("../config/keys");

var client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
});
client.select(0); 

module.exports = client;
