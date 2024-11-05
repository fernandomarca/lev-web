
'use client';

import { VideoPlayer } from "@/components/Video";
import { RoomContext, RoomContextProps } from "@/context/roomContext";
import { use, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from 'next/image';
import PermissionModal from "@/components/PermissionModal";

interface RoomPageProps {
  params: Promise<{ roomId_call: string }>
}

export default function RoomCallPage({ params }: RoomPageProps) {
  const { roomId_call } = use(params);
  const { ws, me, peers } = useContext(RoomContext) as RoomContextProps;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [to_play, setToPlay] = useState<Set<string>>(new Set<string>(['/temp/silence.mp3']));
  const [played, setPlayed] = useState<Set<string>>(new Set<string>([]));
  const [hasInitialAudio, setHasInitialAudio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const play_audio = useCallback(async () => {
    if (isPlaying) {
      console.log("audio is already playing")
      return;
    }
    const audioQueue = Array.from(to_play).filter(file => !played.has(file));
    if (audioRef.current && audioQueue.length > 0) {
      const file = audioQueue.shift() as string;
      console.log("audio-file", file)
      audioRef.current.src = file;
      audioRef.current.play();
      setIsPlaying(true);
      setPlayed(new Set(played.add(file)));
      fetch('/api/delete_played_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_name: file })
      })
    };
  }, [played, to_play]);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    console.log(to_play)
    data.files.forEach((file) => {
      if (!to_play.has(file)) {
        setToPlay(new Set(to_play.add(file)));
      }
    });
    play_audio()
  }, [play_audio, to_play]);



  useEffect(() => {
    if (me) {
      ws.emit('join-room-call', { roomId: roomId_call, peerId: me.id });
    }
  }, [me, roomId_call, ws])

  useEffect(() => {
    setInterval(() => {
      load_audio_files()
    }, 5000)
  }, [load_audio_files])

  useEffect(() => {
    if (hasInitialAudio) {
      play_audio()
    }
  }, [hasInitialAudio, play_audio]);

  useEffect(() => {
    ws.on('get-users', ({ participants }: { participants: string[] }) => {
      if (participants.length >= 2 && !isModalOpen) {
        setHasInitialAudio(true);
      }
    });
  }, [isModalOpen, play_audio, ws])

  function handleEnded() {
    setIsPlaying(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setHasInitialAudio(true);
  };

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
          <audio
            hidden
            controls
            id="audio"
            ref={audioRef}
            onEnded={handleEnded}
          />
        </div>
      </div>
    </div>
  );
}