"use client"

import { CreateCallButton } from "@/components/CreateCallButton";
import { useRoom } from "@/context/roomContext";
import { Loader2 } from "lucide-react";
import React, { FormEvent, useEffect, useState, useTransition } from "react";

export default function CreateCallPage() {
  const [link, setLik] = useState<string>('');
  const { ws } = useRoom();
  const [isFormPending, startTransition] = useTransition();

  useEffect(() => {
    ws.on('room-created', ({ roomId }) => {
      setLik(`http://localhost:3000/call/${roomId}`);
    });
  }, [ws]);


  const createRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget
    const data = new FormData(form);

    startTransition(() => {
      if (ws) {
        ws.emit('create-room-call');
      }
      // const result = await createRoomCommand(data,ws)
      // setFormState(result)
    })

  }

  return (
    <div className="max-w-96">
      <form onSubmit={createRoom}
        className="space-y-4 p-4 bg-white shadow-md rounded-md"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do atendante</label>
          <input
            name="attendant_name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do cliente</label>
          <input
            name="cliente_name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
        <CreateCallButton type="submit" >
          {isFormPending ? <Loader2 className="size-4 animate-spin" /> : 'Criar chamada'}
        </CreateCallButton>
      </form>
    </div>
  )
}