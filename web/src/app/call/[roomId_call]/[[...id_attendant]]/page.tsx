'use client';

import { VideoPlayer } from "@/components/Video";
import { RoomContext, RoomContextProps } from "@/context/roomContext";
import { use, useContext, useEffect, useState } from "react";
import Image from 'next/image';
import PermissionModal from "@/components/PermissionModal";
import { Audio } from "@/components/Audio";
import { Audio2 } from "@/components/Audio2";

interface RoomPageProps {
  params: Promise<{
    roomId_call: string,
    id_attendant?: string
  }>
}

export default function RoomCallPage({ params }: RoomPageProps) {
  const { id_attendant } = use(params);

  const roomId_call = "0192f985-a0ff-708b-bf16-69aa47f002ab";

  const { ws, me, peers } = useContext(RoomContext) as RoomContextProps;
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [hasInitialAudio, setHasInitialAudio] = useState(false);
  const [clickInteract, setClickInteract] = useState(false);

  useEffect(() => {
    if (me) {
      ws.emit('join-room-call', { roomId: roomId_call, peerId: me.id });
    }
  }, [me, roomId_call, ws])

  // useEffect(() => {
  //   ws.on('get-users', ({ participants }: { participants: string[] }) => {
  //     if (participants.length >= 2 && !isModalOpen) {
  //       setHasInitialAudio(true);
  //     }
  //   });
  // }, [isModalOpen, ws]);

  const closeModal = () => {
    setIsModalOpen(false);
    setHasInitialAudio(true);
  };

  return (
    <div >
      <PermissionModal isOpen={isModalOpen} onRequestClose={closeModal} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-end py-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          <Image priority className="w-auto" width={190} height={150} src="/atendante.png" alt="" />
        </div>
        <div className="w-300 h-300 flex justify-start bg-gradient-to-l from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          {Object.entries(peers).map(([peerId, peer]) => (
            <VideoPlayer key={peerId} stream={peer.stream} autoPlay />
          ))}
        </div>
        {!id_attendant && !isModalOpen && (
          <div>
            <Audio2 hasInitialAudio={hasInitialAudio} />
            {!clickInteract && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-black">
                  <p>Sua câmera está ligada? Se sua transmissão de vídeo não iniciou atualize a página</p>
                  <div className="flex justify-center">
                    <button
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                      onClick={() => setClickInteract(true)}
                    >
                      Tudo certo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}