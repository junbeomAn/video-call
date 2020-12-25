const socket = io("/");
const videoGrid = document.getElementById("video-grid");

const startShare = document.getElementById("start-share");
const stopShare = document.getElementById("stop-share");
const startVideo = document.getElementById("start-video");
const stopVideo = document.getElementById("stop-video");

const peerOptions = {
  host: "peerjs-server-practice.herokuapp.com",
  secure: true,
};
const myPeer = new Peer(undefined, peerOptions);

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

const mediaOptions = {
  video: {
    cursor: "always",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};

let shareStatus = null;
const STATUS_OPTIONS = {
  SCREEN: "screen",
  VIDEO: "video",
};

startShare.addEventListener("click", () => {
  shareStatus = "screen";
  getMedia(navigator.mediaDevices, shareStatus).then(startStream);
});
stopShare.addEventListener("click", () => {
  let tracks = myVideo.srcObject.getTracks();
  shareStatus = null;
  tracks.forEach((track) => track.stop());
  myVideo.remove();
});
startVideo.addEventListener("click", () => {
  shareStatus = "video";
  getMedia(navigator.mediaDevices, shareStatus).then(startStream);
});
stopVideo.addEventListener("click", () => {
  shareStatus = null;
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function getMedia(devices, status) {
  let mediaOptions;
  let res = null;

  if (status === STATUS_OPTIONS.SCREEN) {
    mediaOptions = {
      video: {
        cursor: "always",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    };
    res = devices.getDisplayMedia(mediaOptions);
  } else if (status === STATUS_OPTIONS.VIDEO) {
    mediaOptions = {
      video: true,
      audio: true,
    };
    res = devices.getUserMedia(mediaOptions);
  }

  return res;
}

function startStream(stream) {
  addVideoStream(myVideo, stream); // show my screen
  answerToCall(stream);

  stopStreamOnEnd(stream);

  socket.on("user-connected", (userId) => {
    connectToNewUser(userId, stream);
  });
}

function stopStreamOnEnd(stream) {
  stream.getTracks()[0].addEventListener("ended", () => {
    myVideo.remove();
  });
}

function answerToCall(stream) {
  myPeer.on("call", (call) => {
    // receive calls
    call.answer(stream);
    const video = document.createElement("video");
    call.on("stream", (remoteStream) => {
      addVideoStream(video, remoteStream);
    });
    call.on("close", () => {
      video.remove();
    });
    peers[call.peer] = call;
  });
}

function connectToNewUser(userId, stream) {
  // make calls when new users connect to our room
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (remoteStream) => {
    addVideoStream(video, remoteStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
