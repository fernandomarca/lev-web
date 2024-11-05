
'use client';

import { VideoPlayer } from "@/components/Video";
import { useRoom } from "@/context/roomContext";
import { use, useEffect, useState } from "react";
import Image from 'next/image';
import PermissionModal from "@/components/PermissionModal";
import { Audio } from "@/components/Audio";

interface RoomPageProps {
  params: Promise<{ roomId_call: string }>
}

export default function RoomCallPage2({ params }: RoomPageProps) {
  // const { roomId_call } = use(params);
  const roomId_call = "0192f985-a0ff-708b-bf16-69aa47f002ab";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { ws, me, peers, audioState, participants } = useRoom();

  useEffect(() => {
    if (me) {
      ws.emit('join-room-call', { roomId: roomId_call, peerId: me.id });
    }
  }, [me, roomId_call, ws])

  const closeModal = () => {
    setIsModalOpen(false);
    // setHasInitialAudio(true);
    ws.emit('audio_changed', { roomId_call, isPlaying: audioState?.isPlaying, to_play: audioState?.to_play, played: audioState?.played, hasInitialAudio: true });
  };

  useEffect(() => {
    if (participants.length >= 2 && !isModalOpen) {
      // setHasInitialAudio(true);
      ws.emit('audio_changed', { roomId_call, isPlaying: audioState?.isPlaying, to_play: audioState?.to_play, played: audioState?.played, hasInitialAudio: true });
    }
  }, [audioState?.isPlaying, audioState?.played, audioState?.to_play, isModalOpen, participants.length, ws])

  return (
    <div>
      <PermissionModal isOpen={isModalOpen} onRequestClose={closeModal} />
      <div className="grid grid-cols-4 gap-4">
        {/* <VideoPlayer stream={stream} autoPlay /> */}
        <div className="flex col-span-2 justify-end py-9 ">
          <Image width={190} height={180} src="/atendante.png" alt="" />
        </div>
        <div className="flex col-span-2 justify-start">
          {Object.entries(peers).map(([peerId, peer]) => (
            <VideoPlayer key={peerId} stream={peer.stream} autoPlay />
          ))}
        </div>
        <div>
          <Audio roomId_call={roomId_call} />
        </div>
      </div>
    </div>
  );
}