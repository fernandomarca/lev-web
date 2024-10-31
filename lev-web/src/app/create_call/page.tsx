"use client"

import { CreateCallButton } from "@/components/CreateCallButton";
import { RoomContext, RoomContextProps } from "@/context/roomContext";
import React, { useContext, useEffect, useState } from "react";

export default function CreateCallPage() {
  const [attendantName, setAttendantName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [link, setLik] = useState<string>('');

  const { ws } = useContext(RoomContext) as RoomContextProps;

  useEffect(() => {
    ws.on('room-created', ({ roomId }) => {
      setLik(`http://localhost:3000/call/${roomId}`);
    });
  }, [ws]);


  const createRoom = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (ws) {
      ws.emit('create-room-call');
    }
  }

  return (
    <div className="max-w-96">
      <form action=""
        className="space-y-4 p-4 bg-white shadow-md rounded-md"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do atendante</label>
          <input
            name="attendant_name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onChange={(e) => setAttendantName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do cliente</label>
          <input
            name="cliente_name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Link</label>
          <input
            name="link"
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={link}
          />
        </div>
        <CreateCallButton type="submit" onClick={createRoom} />
      </form>
    </div>
  )
}