"use client"

import Peer from 'peerjs';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';
import { Socket } from 'socket.io-client';
import socketIO from 'socket.io-client';
import { v7 as uuidV7 } from 'uuid';
import { peersReducer, PeerState } from './peerReducer';
import { addPeerAction, removePeerAction } from './peerActions';

export interface RoomContextProps {
  ws: Socket
  me: Peer | null
  stream: MediaStream | null
  peers: PeerState
  participants: string[]
}

export const RoomContext = createContext<RoomContextProps>({} as RoomContextProps);

const ws = socketIO(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8080");

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  console.log("NEXT_PUBLIC_SOCKET_SERVER_URL", process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);

  const [me, setMe] = useState<Peer | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [participants, setParticipants] = useState<string[]>([]);

  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log('participants', participants);
    setParticipants(participants);
  }

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  }

  useEffect(() => {
    const meId = uuidV7();
    const peer_server_options = {
      host: process.env.PEER_SERVER_URL || 'localhost',
      port: 9000,
      path: '/'
    };
    let peer: Peer;
    if (process.env.PEER_SERVER_URL) {
      peer = new Peer(meId, peer_server_options);
    }
    peer = new Peer(meId);
    setMe(peer);

    try {
      navigator.mediaDevices.getUserMedia({
        video: true, audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true
        }
      }).then((stream) => {
        setStream(stream);
      })
    } catch (error) {
      console.log('error get user media', error);
    }

    ws.on('get-users', getUsers);
    ws.on('user-disconnected', removePeer);
  }, [])

  useEffect(() => {
    if (!me) return;
    if (!stream) return;

    ws.on('user-joined', ({ peerId }) => {
      const call = me.call(peerId, stream);
      call.on('stream', (peerStream) => {
        dispatch(addPeerAction(peerId, peerStream));
      });
    });

    me.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        dispatch(addPeerAction(call.peer, remoteStream));
      });
    });

  }, [me, stream])

  return (
    <RoomContext.Provider value={{ ws, me, stream, peers, participants }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext);

