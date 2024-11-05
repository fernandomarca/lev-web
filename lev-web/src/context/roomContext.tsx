"use client"

import Peer from 'peerjs';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';
import { Socket } from 'socket.io-client';
import socketIO from 'socket.io-client';
import { v7 as uuidV7 } from 'uuid';
import { peersReducer, PeerState } from './peerReducer';
import { addPeerAction, removePeerAction } from './peerActions';

export interface AudioState {
  roomId: string;
  isPlaying: boolean;
  to_play: string[];
  played: string[];
  hasInitialAudio: boolean;
  audioQueue: string[];
}
export interface RoomContextProps {
  ws: Socket
  me: Peer | null
  stream: MediaStream | null
  peers: PeerState
  audioState: AudioState
  participants: string[]
}

export const RoomContext = createContext<RoomContextProps>({} as RoomContextProps);

const ws = socketIO('http://localhost:8080');

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [me, setMe] = useState<Peer | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [participants, setParticipants] = useState<string[]>([]);

  const [audioState, setAudioState] = useState<AudioState>({
    roomId: '',
    isPlaying: false,
    to_play: ['/temp/silence.mp3'],
    played: [],
    hasInitialAudio: false,
    audioQueue: []
  });

  useEffect(() => {
    ws.on('audio_created', (audio_state: AudioState) => {
      console.log('audio_state created', audio_state);
      setAudioState(audio_state)
    })
    ws.on('audio_updated', (audio_state: AudioState) => {
      console.log('audio_state audio_updated', audio_state);
      setAudioState(audio_state)
    })
  }, [])

  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log('participants', participants);
    setParticipants(participants);
  }

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  }

  useEffect(() => {
    const meId = uuidV7();
    const peer = new Peer(meId, { host: 'localhost', port: 9000, path: "/" });
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
    <RoomContext.Provider value={{ ws, me, stream, peers, audioState, participants }}>
      {children}
    </RoomContext.Provider>
  )
}


export const useRoom = () => useContext(RoomContext);

// const enterRoom = ({ roomId }: { roomId: string }) => {
//   console.log('entering room', roomId);
// }

// useEffect(() => {
//   ws.on('room-created', enterRoom);
// }, [])