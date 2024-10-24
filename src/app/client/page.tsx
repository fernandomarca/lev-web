'use client';

import { useState, useRef, useEffect } from "react";
import SimplePeer, { SignalData } from 'simple-peer';
import Video from "@/components/Video";

export default function ClientPage() {
  const [clientId, setClientId] = useState<string>('');
  const [attendantId, setAttendantId] = useState<string>('');
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      });
  }, []);

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
  };

  return (
    <div>
      <div>
        <Video ref={myVideoRef} />
        <Video ref={remoteVideoRef} />
      </div>
      <div>
        <button onClick={connectPeer}>Entrar na fila</button>
      </div>
    </div>
  );
}