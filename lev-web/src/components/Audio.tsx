"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function Audio({ hasInitialAudio }: { hasInitialAudio: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [to_play, setToPlay] = useState<Set<string>>(new Set<string>(['/temp/silence.mp3']));
  const [to_play, setToPlay] = useState<Set<string>>(new Set<string>([]));
  const [played, setPlayed] = useState<Set<string>>(new Set<string>([]));

  const play_audio = useCallback(async () => {
    const audioQueue = Array.from(to_play).filter(file => !played.has(file));
    if (audioRef.current && audioQueue.length > 0) {
      const file = audioQueue.shift() as string;
      try {
        console.log("playing audioSrc", file)
        audioRef.current.src = file;
        audioRef.current.play().catch(error => {
          console.error("Erro ao reproduzir áudio:", error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
        setPlayed(new Set(played.add(file)));
      } catch (error) {
        console.error("play audio error", error)
        setIsPlaying(false);
      }
      setTimeout(() => {
        fetch('/api/delete_played_audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ file_name: file })
        })
      }, 1000);
    };
  }, [played, to_play]);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    console.log("load_audio_files", data.files)
    data.files.forEach((file) => {
      if (!to_play.has(file)) {
        setToPlay(new Set(to_play.add(file)));
      }
    });
    // play_audio()
  }, [to_play]);

  useEffect(() => {
    if (!isPlaying) {
      play_audio();
    }
  }, [isPlaying, play_audio]);

  useEffect(() => {
    setInterval(() => {
      load_audio_files()
    }, 5000)
  }, [load_audio_files])

  function handleEnded() {
    console.log("handleEnded")
    setIsPlaying(false);
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