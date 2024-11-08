"use client";

import { useEffect, useRef, useState } from "react";

export function Audio2({ hasInitialAudio }: { hasInitialAudio: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const loadedFiles = useRef<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);


  const load_audio_files = async () => {
    const response = await fetch('/api/files');
    const data: { files: string[] } = await response.json();
    console.log("load_audio_files", data.files)
    const newFiles = data.files.filter(file => !loadedFiles.current.has(file));
    newFiles.forEach(file => loadedFiles.current.add(file));
    setAudioFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

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
    const interval = setInterval(() => {
      load_audio_files()
    }, 5000)
    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    const playAudio = async () => {
      if (audioFiles.length > 0 && audioRef.current) {
        try {
          const audioSrc = await fetchAudioBuffer(audioFiles[currentIndex]);
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          setIsPlaying(true);

          fetch('/api/delete_played_audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file_name: audioFiles[currentIndex] })
          })

        } catch (error) {
          console.error(`Failed to load audio file: ${audioFiles[currentIndex]}`, error);
          handleEnded();
        }
      }
    };
    if (!isPlaying) {
      playAudio();
    }
  }, [audioFiles, currentIndex]);

  useEffect(() => {
    if (audioFiles.length > 0 && !isPlaying) {
      setCurrentIndex(0);
    }
  }, [audioFiles]);

  const handleEnded = () => {
    setIsPlaying(false);
    console.log("handleEnded", currentIndex, audioFiles.length)

    setAudioFiles(prevFiles => prevFiles.filter((_, index) => index !== currentIndex));

    if (currentIndex < audioFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
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