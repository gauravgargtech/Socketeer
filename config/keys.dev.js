module.exports = {
    port: 3000,
    hostUrl : 'http://localhost:3000/',
    sttHost: 'http://localhost:5001',
    mysql: {
      host: "localhost",
      username: "voice",
      password: "voice",
      database: "voiced",
      port: 3306,
    },
    redis: {
      host: "localhost",
      port: 6379,
    },
    mongo: {
      scheme: "",
      host: "",
      username: "",
      password: "",
      database: "",
    },
    googleKeys: {
      clientId: "",
      clientSecret: "",
    },
    cookieKey: "",
    email: {
      host: "",
      username: "",
      password: "",
      from: "",
      port: 587,
    },
    awsCloudWatch: {
      groupName: "",
      streamName: "",
      awsSecretKey: "",
      awsAccessKey: "",
    },
  };
  