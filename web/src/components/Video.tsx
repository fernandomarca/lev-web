"use client";

import { convertVideoToAudio } from '@/utils/convert_video';
import React, { useEffect, useRef } from 'react';

// const Video = forwardRef<HTMLVideoElement>((props, ref) => (
//   <video ref={ref} autoPlay playsInline muted style={{ width: '300px', height: '300px' }} />
// ));

// Video.displayName = 'Video';

// export default Video;

interface VideoPlayerProps extends React.HTMLProps<HTMLVideoElement> {
  stream: MediaStream | null,
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, ...rest }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = async (stream: MediaStream) => {
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
      formData.append('file', audioFile, fileName);

      const token = "c4b9271a-6f05-4e09-a41a-520c16ce6205";
      console.log("NEXT_PUBLIC_AGENT_SERVER_URL", process.env.NEXT_PUBLIC_AGENT_SERVER_URL);

      const _result = await fetch('https://levbot-1011986942225.us-central1.run.app/save_audio', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      audioChunksRef.current = [];
      mediaRecorder.start();
    }

    mediaRecorder.start();

    setInterval(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, 20000)
  };

  const hasPinged = useRef(false);

  const ping = async () => {
    const result = await fetch("https://levbot-1011986942225.us-central1.run.app/levbot/", {
      method: 'POST',
    });
    console.log('ping', result);
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        if (!hasPinged.current) {
          ping();
          hasPinged.current = true;
        }
        setTimeout(() => {
          startRecording(stream);
        }, 10000)
      }
    }
  }, []);

  // return <Video ref={videoRef} {...rest} />;
  return <video ref={videoRef} {...rest} playsInline style={{ width: '300px', height: '300px' }} />;
}

VideoPlayer.displayName = 'VideoPlayer';

// enviar para agente
// const _result = await fetch('/api/send_audio', {
//   method: 'POST',
//   body: formData
// });