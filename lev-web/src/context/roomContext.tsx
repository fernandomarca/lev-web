"use client"

import Peer from 'peerjs';
import React, { createContext, ReactNode, useEffect, useReducer, useState } from 'react';
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
}

export const RoomContext = createContext<null | RoomContextProps>(null);

const ws = socketIO('http://localhost:8080');

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [me, setMe] = useState<Peer | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, dispatch] = useReducer(peersReducer, {});

  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log('participants', participants);
  }

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  }

  useEffect(() => {
    const meId = uuidV7();
    const peer = new Peer(meId);
    setMe(peer);

    try {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
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
    <RoomContext.Provider value={{ ws, me, stream, peers }}>
      {children}
    </RoomContext.Provider>
  )
}

// const enterRoom = ({ roomId }: { roomId: string }) => {
//   console.log('entering room', roomId);
// }

// useEffect(() => {
//   ws.on('room-created', enterRoom);
// }, [])