import { Socket } from "socket.io";
import { v7 as uuidV7 } from 'uuid';

const rooms: Record<string, string[]> = {}; // roomId -> [peerId]
const rooms_audio_state: Record<string, AudioState> = {}; // roomId -> audio_state

export interface AudioState {
  roomId: string;
  isPlaying: boolean;
  to_play: string[];
  played: string[];
  hasInitialAudio: boolean;
  audioQueue: string[];
}
interface IRoomParams {
  roomId: string;
  peerId: string;
}

export const roomHandler = (socket: Socket) => {

  const createRoom = () => {
    console.log('total rooms', rooms);
    // const roomId = uuidV7();
    const roomId = "0192f985-a0ff-708b-bf16-69aa47f002ab";
    rooms[roomId] = [];
    rooms_audio_state[roomId] = {
      roomId,
      isPlaying: false,
      to_play: ['/temp/silence.mp3'],
      played: [],
      hasInitialAudio: false,
      audioQueue: []
    };
    socket.emit('room-created', { roomId });
    socket.emit('audio_created', { audio_state: rooms_audio_state[roomId] });
    console.log('created room', roomId);
  }

  const joinRoom = ({ roomId, peerId }: IRoomParams) => {
    if (rooms[roomId]) {
      console.log('user joined the room', roomId, peerId);
      socket.join(roomId);
      rooms[roomId].push(peerId);
      socket.to(roomId).emit('user-joined', { peerId });
      socket.emit('get-users', {
        roomId,
        participants: rooms[roomId]
      })
    }

    socket.on('disconnect', () => {
      console.log('user left the room', peerId);
      leaveRoom({ roomId, peerId });
    });
  }

  const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
    rooms[roomId] = rooms[roomId].filter(id => id !== peerId);
    // if (rooms[roomId].length === 0) {
    //   console.log('total rooms', rooms);
    //   delete rooms[roomId];
    // }
    socket.to(roomId).emit('user-disconnected', peerId);
  }

  socket.on('create-room-call', createRoom);
  socket.on('join-room-call', joinRoom);

  socket.on('audio_changed', ({ roomId_call, isPlaying, to_play, played, hasInitialAudio }: {
    roomId_call: string,
    isPlaying: boolean,
    to_play: string[],
    played: string[],
    hasInitialAudio: boolean
  }) => {
    console.log("audio_changed", { roomId_call, isPlaying, to_play, played, hasInitialAudio });
    const audioQueue: string[] = []
    if (to_play && played) {
      const new_to_play = to_play.filter(file => !played.includes(file));
      audioQueue.push(...new_to_play);
      console.log("audioQueue", audioQueue)
    }

    const audio_state = rooms_audio_state[roomId_call] = {
      roomId: roomId_call,
      isPlaying,
      to_play: to_play,
      played: played,
      hasInitialAudio,
      audioQueue
    };
    console.log("console audio state", audio_state);
    socket.emit('audio_updated', { audio_state });
  });
}