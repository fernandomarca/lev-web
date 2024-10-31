"use client";

interface CreateCallButtonProps extends React.HTMLProps<HTMLButtonElement> {
  roomId?: string;
}

export const CreateCallButton: React.FC<CreateCallButtonProps> = ({ ...rest }) => {
  return (
    <button
      {...rest}
      type="button"
      className="border py-2 px-8 bg-green-400 rounded-lg text-xl font-semibold hover:bg-green-300">
      criar chamada
    </button>
  )
}