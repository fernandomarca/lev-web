"use client";

import { convertVideoToAudio } from '@/utils/convert_video';
import React, { forwardRef, useEffect, useRef } from 'react';

const Video = forwardRef<HTMLVideoElement>((props, ref) => (
  <video ref={ref} autoPlay playsInline style={{ width: '300px', height: '300px' }} />
));

Video.displayName = 'Video';

export default Video;

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

      // enviar para agente
      // const _result = await fetch('/api/send_audio', {
      //   method: 'POST',
      //   body: formData
      // });
      const token = "c4b9271a-6f05-4e09-a41a-520c16ce6205";
      const _result = await fetch(process.env.PUBLIC_AGENT_SERVER_URL || 'http://localhost:8000/save_audio/', {
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
      mediaRecorder.stop();
    }, 10000)
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        startRecording(stream);
      }
    }
  }, [stream]);

  return <Video ref={videoRef} {...rest} />;
}