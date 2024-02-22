import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../Context/SocketProvider";
import ReactPlayer from "react-player";
import Peer from "../Services/Peer";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [call, setCall] = useState(false);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log("Email Joined", email, id);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setCall(true);
    const offer = await Peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);
      const ans = await Peer.getAnswer(offer);
      console.log("Incoming Call", from, offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStream = useCallback(() => {
    // for (const track of myStream.getTracks()) {
    //   Peer.peer.addTrack(track, myStream);
    // }

    myStream.getTracks().forEach((track) => {
      Peer.peer.addTrack(track, myStream);
    });
  }, [myStream]);

  const handleAcceptedCall = useCallback(
    ({ from, ans }) => {
      Peer.setLocalDescription(ans);
      console.log("Call Accepted", from, ans);
      sendStream();
    },
    [sendStream]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await Peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    Peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      Peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await Peer.getAnswer(offer);
      socket.emit("peer:nego:done", { ans, to: from });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await Peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    Peer.peer.addEventListener("track", (event) => {
      const remoteStream = event.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user-joined", handleUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleAcceptedCall);
    socket.on("peer:nego:needed", handleNegoIncoming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleAcceptedCall);
      socket.off("peer:nego:needed", handleNegoIncoming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleAcceptedCall,
    handleNegoIncoming,
    handleNegoFinal,
  ]);
  return (
    <div className="Room-Container">
      <h1>Room</h1>
      <h3>{remoteSocketId ? "You are Connected " : "No one is in room "}</h3>
      {myStream && <ReactPlayer url={myStream} playing muted />}
      <div className="btn">
        {myStream && <button onClick={sendStream}>Send Stream</button>}
        {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      </div>
      {remoteStream && <h2>Remote Stream</h2>}
      {remoteStream && <ReactPlayer url={remoteStream} playing muted />}
    </div>
  );
};

export default Room;
