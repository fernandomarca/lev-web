'use client';

import { VideoPlayer } from "@/components/Video";
import { RoomContext, RoomContextProps } from "@/context/roomContext";
import { useContext, useEffect, useState } from "react";
import PermissionModal from "@/components/PermissionModal";

interface RoomPageProps {
  params: Promise<{
    roomId_call: string,
    id_attendant?: string
  }>
}

export default function RoomCallPage({ params }: RoomPageProps) {
  const roomId_call = "0192f985-a0ff-708b-bf16-69aa47f002ac";

  const { ws, me, peers, stream } = useContext(RoomContext) as RoomContextProps;
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    if (me) {
      ws.emit('join-room-call', { roomId: roomId_call, peerId: me.id });
    }
  }, [me, roomId_call, ws])

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div >
      <PermissionModal isOpen={isModalOpen} onRequestClose={closeModal} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-end bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          <VideoPlayer key={me?.id} stream={stream} autoPlay muted />
        </div>
        <div className="flex justify-start bg-gradient-to-l from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          {Object.entries(peers).map(([peerId, peer]) => (
            <VideoPlayer key={peerId} stream={peer.stream} autoPlay muted />
          ))}
        </div>
      </div>
    </div>
  );
}