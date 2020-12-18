const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "peerjs-server-practice.herokuapp.com",
  secure: true,
});
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      // receive calls
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        const video = document.createElement("video");
        addVideoStream(video, remoteStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

function connectToNewUser(userId, stream) {
  // make calls when new users connect to our room
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  // video.muted = true;
  call.on("stream", (remoteStream) => {
    addVideoStream(video, remoteStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
