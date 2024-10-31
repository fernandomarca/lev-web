import { ADD_PEER, REMOVE_PEER } from "./peerActions";


export type PeerState = Record<string, { stream: MediaStream }>;
type PeerAction =
  | {
    type: typeof ADD_PEER;
    payload: { peerId: string; stream: MediaStream };
  }
  | {
    type: typeof REMOVE_PEER;
    payload: { peerId: string }
  };

export const peersReducer = (state: PeerState, action: PeerAction): PeerState => {
  switch (action.type) {
    case ADD_PEER:
      return {
        ...state,
        [action.payload.peerId]: { stream: action.payload.stream }
      };
    case REMOVE_PEER:
      const newState = { ...state };
      delete newState[action.payload.peerId];
      // const { [action.payload.peerId]: _deleted, ...newState } = state;
      return newState;
    default:
      return { ...state };
  }
}