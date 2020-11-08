var jsFiles = [];
var totalJsFiles = 0;
var jsFilesloaded = 0;
function includeJs(file) {
  jsFiles.push(file);
}

function includeCss(cssURL) {
  return new Promise(function (resolve, reject) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssURL;
    document.head.appendChild(link);
    link.onload = function () {
      drawBox();
      resolve();
    };
  });
}
function loadJsFile(file) {
  totalJsFiles--;
  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = file;
    script.type = "text/javascript";
    document.getElementsByTagName("head").item(0).appendChild(script);
    script.onload = function () {
      if (totalJsFiles > 1) {
        jsFilesloaded++;
        loadJsFile(jsFiles[jsFilesloaded]);
      } else {
        loadSockets();
      }
      resolve();
    };
  });
}
includeJs("./supporter.js");
includeJs("./drawer.js");
includeJs(
  "https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.1/socket.io.js"
);
includeJs("https://code.jquery.com/jquery-3.2.1.slim.min.js");

function openChatWindow(msg) {
  if (typeof msg.messages != "undefined") {
    var appender = "<ul>";
    for (key in msg.messages) {
      appender += `<li>${msg.messages[key][0]}</li>`;
    }
    appender += "</ul>";
    $("#messages_list").append(appender);
  }
  $(".Layout").toggle();
}
function serveInstruction(msg) {
  if (typeof msg != "undefined") {
    if (msg.action == "redirect") {
      console.log("redirecting");
      window.location.href = msg.redirect;
    } else if (msg.action == "close") {
      $(".Layout").toggle();
    }
  }
}
totalJsFiles = jsFiles.length;
loadJsFile(jsFiles[0]);

var socket;
function loadSockets() {
  socket = new io("http://localhost:4000/");

  socket.on("connect", () => {
    console.log(socket.connected);
  });
  socket.on("disconnect", () => {
    console.log(socket.connected);
  });

  socket.on("event", function (msg) {
    switch (msg.commandType) {
      case "hotword":
        openChatWindow(msg);
      case "instruction":
        serveInstruction(msg);
    }
    console.log(msg);
  });
}
window.onload = function () {
  function captureCamera(callback) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (camera) {
        callback(camera);
      })
      .catch(function (error) {
        alert("Unable to capture your camera. Please check console logs.");
        console.error(error);
      });
  }

  function stopRecordingCallback() {
    video.srcObject = null;
    var blob = recorder.getBlob();
    video.src = URL.createObjectURL(blob);

    recorder.microphone.stop();
    video.muted = false;
  }

  var recorder;

  document.getElementById("btn-start-recording").onclick = function () {
    this.disabled = true;
    captureCamera(function (microphone) {
      recorder = RecordRTC(microphone, {
        type: "audio",
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        recorderType: RecordRTC.StereoAudioRecorder, // force for all browsers
        mimeType: {
          audio: "audio/wav",
        },
      });

      recorder.startRecording();

      var speechEvents = hark(microphone.clone(), {});

      speechEvents.on("speaking", function () {
        recorder.microphone = microphone;

        if (recorder.getState() === "paused") {
          recorder.resumeRecording();
        }
      });

      speechEvents.on("stopped_speaking", function () {
        recorder.stopRecording(function () {
          let blob = recorder.getBlob();
          socket.emit("message", blob);

          recorder.clearRecordedData();
          recorder.destroy();
          recorder = RecordRTC(microphone, {
            type: "audio",
            desiredSampRate: 16000,
            numberOfAudioChannels: 1,
            recorderType: RecordRTC.StereoAudioRecorder, // force for all browsers
            mimeType: {
              audio: "audio/wav",
            },
          });

          recorder.startRecording();
        });
      });
      recorder.microphone = microphone;
    });
  };
};
