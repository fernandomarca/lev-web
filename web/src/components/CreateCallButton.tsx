"use client";

import { ReactNode } from "react";

interface CreateCallButtonProps extends React.HTMLProps<HTMLButtonElement> {
  roomId?: string;
  children: ReactNode;
}

export const CreateCallButton: React.FC<CreateCallButtonProps> = ({ children, type, ...rest }) => {
  return (
    <button
      {...rest}
      className="border py-2 px-8 bg-green-400 rounded-lg text-xl font-semibold hover:bg-green-300">
      {children}
    </button>
  )
}