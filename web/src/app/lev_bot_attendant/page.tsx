'use client';

import { useRoom } from "@/context/roomContext";
import { use, useState } from "react";
import Image from 'next/image';
import PermissionModal from "@/components/PermissionModal";
import { Audio } from "@/components/Audio";
import { VideoPlayerSelf } from "@/components/VideoSelf";

interface RoomPageProps {
  params: Promise<{
    roomId_call: string,
    id_attendant?: string
  }>
}

export default function RoomCallPage({ params }: RoomPageProps) {
  const { id_attendant } = use(params);
  const roomId_call = "0192f985-a0ff-708b-bf16-69aa47f002ab";
  const { me, stream } = useRoom();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [clickInteract, setClickInteract] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const ping = async () => {
    const result = await fetch(`${process.env.NEXT_PUBLIC_AGENT_SERVER_URL}/levbot/`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
    });
    return result
  }

  async function initCall() {
    setClickInteract(true);
    const result = await ping();
    console.log('ping', result);
  }

  return (
    <div >
      <PermissionModal isOpen={isModalOpen} onRequestClose={closeModal} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-end bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          <Image priority className="w-[250px] h-[250px] mt-3" width={250} height={250} src="/atendante.png" alt="" />
        </div>
        <div className="flex justify-start bg-gradient-to-l from-blue-500 to-purple-500 rounded-lg p-5 shadow-lg">
          {stream && <VideoPlayerSelf key={me?.id} stream={stream} autoPlay muted />}
        </div>
        {!id_attendant && !isModalOpen && (
          <div>
            <Audio />
            {!clickInteract && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-black">
                  <p>Sua câmera está ligada? Se sua transmissão de vídeo não iniciou atualize a página
                    se estiver tudo certo clique em {`"Tudo certo"`} para iniciar a chamada.
                  </p>
                  <div className="flex justify-center">
                    <button
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                      onClick={() => initCall()}
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