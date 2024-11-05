"use client";

import { RoomContextProps, useRoom } from "@/context/roomContext";
import { useCallback, useEffect, useRef } from "react";

export function Audio({ roomId_call }: { roomId_call: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { ws, audioState } = useRoom() as RoomContextProps;

  console.log("audioState component Audio", audioState)

  const play_audio = useCallback(async () => {
    if (audioState?.isPlaying) {
      console.log("audio is already playing")
      return;
    }
    if (audioRef.current && audioState.audioQueue.length > 0) {
      const file = audioState.audioQueue.shift() as string;
      console.log("audio-file", file)
      audioRef.current.src = file;
      audioRef.current.play();
      // setIsPlaying(true);
      audioState.played.push(file);
      ws.emit('audio_changed', { roomId_call, isPlaying: true, to_play: audioState.to_play, played: audioState.played, hasInitialAudio: audioState.hasInitialAudio });

      fetch('/api/delete_played_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_name: file })
      })
    };
  }, [audioState.audioQueue, audioState.hasInitialAudio, audioState?.isPlaying, audioState.played, audioState.to_play, roomId_call, ws]);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    data.files.forEach((file) => {
      console.log("audioState.to_play", audioState.to_play)
      const file_include = audioState.to_play.includes(file);
      if (audioState && !file_include) {
        audioState.to_play.push(file);
        ws.emit('audio_changed', { roomId_call, isPlaying: audioState.isPlaying, to_play: audioState.to_play, played: audioState.played, hasInitialAudio: audioState.hasInitialAudio });
      }
    });
    play_audio()
  }, [audioState, play_audio, roomId_call, ws]);

  useEffect(() => {
    setInterval(() => {
      load_audio_files()
    }, 5000)
  }, [load_audio_files])

  useEffect(() => {
    if (audioState?.hasInitialAudio) {
      console.log("hasInitialAudio played", audioState?.hasInitialAudio)
      play_audio()
    }
  }, [audioState?.hasInitialAudio, play_audio]);

  function handleEnded() {
    // setIsPlaying(false);
    ws.emit('audio_changed', { roomId_call, isPlaying: false, to_play: audioState?.to_play, played: audioState?.played, hasInitialAudio: audioState?.hasInitialAudio });
  };
  return (
    <audio
      controls
      id="audio"
      ref={audioRef}
      onEnded={handleEnded}
    />
  )
}