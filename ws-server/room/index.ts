import { Socket } from "socket.io";
import { v7 as uuidV7 } from 'uuid';

const rooms: Record<string, string[]> = { "0192f985-a0ff-708b-bf16-69aa47f002ac": [] }; // roomId -> [peerId]

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

    socket.emit('room-created', { roomId });
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
}