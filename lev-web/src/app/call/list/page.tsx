"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Call {
  id: string,
  attendant_name: string,
  attendant_peer_id: string,
  client_name: string,
  client_peer_id: string,
  created_at: string
}

export default function ListCall() {
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    fetch('/api/get_calls')
      .then(res => res.json())
      .then(data => setCalls(data.calls));
  }, []);

  return (
    <div>
      <h1>Calls</h1>
      <ul>
        {calls.map(call => (
          <li key={call.id}>
            <p>Call ID: {call.id}</p>
            <p>Attendant: {call.attendant_name}</p>
            <p>Client: {call.client_name}</p>
            <p>Created at: {call.created_at}</p>
            <Link href={`/call/attendant/${call.id}`} className="border p-1 w-40  bg-red-400 rounded-md text-xl font-semibold">attender</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}