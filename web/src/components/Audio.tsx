"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function Audio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [to_play, setToPlay] = useState<Set<string>>(new Set<string>([]));
  const [played, setPlayed] = useState<Set<string>>(new Set<string>([]));

  const fetchAudioBuffer = async (file: string) => {
    const response = await fetch(`/${file}`);
    if (!response.ok) {
      setIsPlaying(false);
      console.log(`Failed to fetch ${file}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    const play_audio = async () => {
      const audioQueue = Array.from(to_play).filter(file => !played.has(file));
      if (audioRef.current && audioQueue.length > 0) {
        const file = audioQueue.shift() as string;
        try {
          console.log("playing audioSrc", file)
          const audioSrc = await fetchAudioBuffer(file);
          audioRef.current.src = audioSrc;
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

        fetch('/api/delete_played_audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ file_name: file })
        })
      };
    }
    if (!isPlaying) {
      play_audio();
    }
  }, [isPlaying, to_play]);

  const load_audio_files = useCallback(async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    console.log("load_audio_files", data.files)
    data.files.forEach((file) => {
      if (!to_play.has(file)) {
        setToPlay(new Set(to_play.add(file)));
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      load_audio_files()
    }, 5000)
    return () => clearInterval(interval);
  }, [])

  function handleEnded() {
    console.log("handleEnded")
    setIsPlaying(false);
  };

  return (
    <audio
      hidden
      controls
      id="audio"
      ref={audioRef}
      onEnded={handleEnded}
    />
  )
}