"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function Audio({ hasInitialAudio }: { hasInitialAudio: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [to_play, setToPlay] = useState<Set<string>>(new Set<string>(['/temp/silence.mp3']));
  const [played, setPlayed] = useState<Set<string>>(new Set<string>([]));

  const play_audio = useCallback(async () => {
    if (isPlaying) {
      console.log("audio is already playing")
      return;
    }
    const audioQueue = Array.from(to_play).filter(file => !played.has(file));
    if (audioRef.current && audioQueue.length > 0) {
      const file = audioQueue.shift() as string;
      audioRef.current.src = file;
      audioRef.current.load();
      audioRef.current.play();
      setIsPlaying(true);
      setPlayed(new Set(played.add(file)));
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
  }, [isPlaying, played, to_play]);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    data.files.forEach((file) => {
      if (!to_play.has(file)) {
        setToPlay(new Set(to_play.add(file)));
      }
    });
    // play_audio()
  }, [to_play]);

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

  function handleEnded() {
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