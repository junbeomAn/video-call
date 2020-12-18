const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { v4: uuidV4 } = require("uuid");

const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

http.listen(PORT, () => {
  console.log(`listening to port : ${PORT}`);
});
