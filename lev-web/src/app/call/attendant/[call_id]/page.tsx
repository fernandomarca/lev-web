'use client';

import { useState, useRef, useEffect, use } from "react";
import SimplePeer, { SignalData } from 'simple-peer';
import Video from "@/components/Video";

interface PageProps {
  params: Promise<{ call_id: string }>
}
export default function AttendantCallPage({ params }: PageProps) {
  const unwrappedParams = use(params);
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
    createPeer();
  }, []);

  const createPeer = () => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: myVideoRef.current?.srcObject as MediaStream
    });

    newPeer.on('signal', async (data: SignalData) => {
      const attendantId = JSON.stringify(data);
    });

    newPeer.on('stream', (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    setPeer(newPeer);
  };

  const handleConnect = async () => {
    const response = await fetch(`/api/get_call?call_id=${unwrappedParams.call_id}`);
    const data: { call: { id: string, attendant_name: string, attendant_peer_id: string, client_name: string, client_peer_id: string, created_at: string } } = await response.json();
    if (peer && data.call.client_peer_id) {
      peer.signal(JSON.parse(data.call.client_peer_id));
    }
  };

  return (
    <div>
      <div>
        <Video ref={myVideoRef} />
        <Video ref={remoteVideoRef} />
      </div>
      <div className="gap-2">
        <button className="border p-1 w-40  bg-red-400 rounded-md text-xl font-semibold" onClick={handleConnect}>Iniciar</button>
      </div>
    </div>
  );
}