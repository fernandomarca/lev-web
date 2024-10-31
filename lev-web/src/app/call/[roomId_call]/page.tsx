
'use client';

import { VideoPlayer } from "@/components/Video";
import { RoomContext, RoomContextProps } from "@/context/roomContext";
import { use, useContext, useEffect } from "react";

interface RoomPageProps {
  params: Promise<{ roomId_call: string }>
}

export default function RoomCallPage({ params }: RoomPageProps) {
  const { roomId_call } = use(params);

  const { ws, me, stream, peers } = useContext(RoomContext) as RoomContextProps;

  useEffect(() => {
    if (me) ws.emit('join-room-call', { roomId: roomId_call, peerId: me.id });
  }, [me, roomId_call, ws])
  return (
    <div>
      <h1>{roomId_call}</h1>
      <div className="grid grid-cols-4 gap-4">

        <VideoPlayer stream={stream} autoPlay />

        {Object.entries(peers).map(([peerId, peer]) => (
          <VideoPlayer key={peerId} stream={peer.stream} autoPlay />
        ))}
      </div>
    </div>
  );
}