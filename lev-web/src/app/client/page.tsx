'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import SimplePeer, { SignalData } from 'simple-peer';
import Video from "@/components/Video";
import { convertVideoToAudio } from "@/utils/convert_video";
import PeerBuilder from "@/utils/peerBuilder";

export default function ClientPage() {
  const [clientId, setClientId] = useState<string>('');
  const [attendantId, setAttendantId] = useState<string>('');
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [to_play, setToPlay] = useState<Set<string>>(new Set<string>(['temp/onyx_lev.mp3']));
  const [played, setPlayed] = useState<Set<string>>(new Set<string>([]));
  const [hasInitialAudio, setHasInitialAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' });
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(audioChunksRef.current, { type: 'video/webm' });
        const videoFile = new File([videoBlob], 'output.webm', { type: 'video/webm' });

        const audioFile = await convertVideoToAudio(videoFile);

        const formData = new FormData();
        const fileName = `recording-${Date.now()}.mp3`;
        formData.append('audio', audioFile, fileName);

        //enviar para agente
        // const _result = await fetch('/api/upload_audio', {
        //   method: 'POST',
        //   body: formData
        // });

        audioChunksRef.current = [];
        mediaRecorder.start();
      }

      mediaRecorder.start();

      setInterval(() => {
        mediaRecorder.stop();
      }, 10000)
    };
    startRecording();
  }, []);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    data.files.forEach((file) => {
      if (!to_play.has(file)) {
        setToPlay(new Set(to_play.add(file)));
      }
    });
  }, [to_play]);

  const play_audio = useCallback(async () => {
    if (isPlaying) {
      return;
    }
    const audioQueue = Array.from(to_play).filter(file => !played.has(file));
    if (audioRef.current && audioQueue.length > 0) {
      const file = audioQueue.shift() as string;
      audioRef.current.src = file;
      audioRef.current.play();
      setIsPlaying(true);
      setPlayed(new Set(played.add(file)));
    };
  }, [isPlaying, played, to_play]);

  useEffect(() => {
    setInterval(() => {
      load_audio_files()
    }, 5000)
  }, [load_audio_files])

  useEffect(() => {
    if (hasInitialAudio) {
      play_audio()
    }
  }, [to_play, isPlaying, hasInitialAudio, play_audio]);

  const build_peer = async () => {
    try {
      const new_peer = await new PeerBuilder().setOnError(() => { console.log("error") }).build();
      console.log("create", new_peer)
    } catch (e) {
      console.log("error", e)
    }
  }

  useEffect(() => {
    build_peer()
  }, [])

  const connectPeer = async () => {
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: myVideoRef.current?.srcObject as MediaStream
    });

    newPeer.on('signal', async (data: SignalData) => {
      const clientId = JSON.stringify(data);
      await fetch('/api/attendant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId })
      });
    });

    newPeer.on('stream', (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    const response = await fetch('/api/client');
    const data: { attendantId?: string } = await response.json();
    if (data.attendantId) {
      newPeer.signal(JSON.parse(data.attendantId));
    }
    setPeer(newPeer);
    setHasInitialAudio(true);
    play_audio()
  };

  function handleEnded() {
    setIsPlaying(false);
  };

  return (
    <div>
      <div>
        <Video ref={myVideoRef} />
        <Video ref={remoteVideoRef} />
        <audio
          controls
          id="audio"
          ref={audioRef}
          onEnded={handleEnded}
        />
      </div>
      <div>
        <button className="border p-1 w-40 bg-green-400 rounded-md text-xl font-semibold" onClick={connectPeer}>Entrar na fila</button>
      </div>
    </div >
  );
}

