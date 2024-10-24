'use client';

import { useState, useRef, useEffect } from "react";
import SimplePeer, { SignalData } from 'simple-peer';
import Video from "@/components/Video";

export default function AttendantPage() {
  const [attendantId, setAttendantId] = useState<string>('');
  const [ClientId, setClientId] = useState<string>('');
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

  const createPeer = () => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: myVideoRef.current?.srcObject as MediaStream
    });

    newPeer.on('signal', async (data: SignalData) => {
      const attendantId = JSON.stringify(data);
      await fetch('/api/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attendantId })
      });
    });

    newPeer.on('stream', (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    setPeer(newPeer);
  };

  const handleConnect = async () => {
    const response = await fetch('/api/attendant');
    const data: { clientId?: string } = await response.json();
    if (peer && data.clientId) {
      peer.signal(JSON.parse(data.clientId));
    }
  };

  return (
    <div>
      <div>
        <Video ref={myVideoRef} />
        <Video ref={remoteVideoRef} />
      </div>
      <div className="gap-2">
        <button className="border p-1 w-40 bg-green-400 rounded-md text-xl font-semibold" onClick={createPeer}>Criar link</button>
        <button className="border p-1 w-40  bg-red-400 rounded-md text-xl font-semibold" onClick={handleConnect}>Atender</button>
      </div>
    </div>
  );
}