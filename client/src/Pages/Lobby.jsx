import React, { useCallback, useEffect, useState } from "react";
import "../App.css";
import { useSocket } from "../Context/SocketProvider";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();
  // console.log(Socket);
  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [socket, email, room]
  );

  const handleRoomJoin = useCallback((data) => {
    const { email, room } = data;
    // navigate(`/room/${room}?email=${email}`);
    navigate(`/room/${room}`);
    // console.log("room:join", data);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("room:join", handleRoomJoin);

      return () => {
        socket.off("room:join", handleRoomJoin);
      };
    }
  }, [socket, handleRoomJoin]);

  return (
    <div className="container">
      <div>
        <form onSubmit={handleFormSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your Email"
          />
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            type="text"
            placeholder="Join Room"
          />
          <button type="submit">Join</button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
