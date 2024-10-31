import { MediaConnection } from "peerjs";
import Media from "./media";
import { PeerCustomModule } from "./peerBuilder";
import UserStream from "./userStream";

interface User {
  id: string;
  username: string;
  isSpeaker: boolean;
  roomId: string;
  peerId: string;
}

export default class RoomService {
  constructor(
    private media: Media,
    private currentPeer: PeerCustomModule,
    private currentUser: User,
    private currentStream: UserStream,
    private isAudioActive = true,
    private peers = new Map(),
  ) { }
  async init() {
    this.currentStream = new UserStream({
      stream: await this.media.getUserAudio(),
      isFake: false
    })
  }

  setCurrentPeer(peer: PeerCustomModule) {
    this.currentPeer = peer
  }

  getCurrentUser() {
    return this.currentUser
  }

  _reconnectPeers(stream: MediaStream) {
    for (const peer of this.peers.values()) {
      const peerId = peer.call.peer
      peer.call.close()
      console.log('calling', peerId)

      this.currentPeer.call(peerId, stream)
    }
  }

  async getCurrentStream() {
    // const { isSpeaker } = this.currentUser
    // if (isSpeaker) {
    //   return this.currentStream.stream
    // }

    // return this.media.createMediaStreamFake()
    return this.currentStream.stream
  }

  addReceivedPeer(call: MediaConnection) {
    const calledId = call.peer
    this.peers.set(calledId, { call })

    const isCurrentId = calledId === this.currentUser.id
    return { isCurrentId }
  }

  disconnectPeer(peerId: string) {
    if (!this.peers.has(peerId)) {
      return;
    }

    this.peers.get(peerId).call.close()
    this.peers.delete(peerId);
  }

  async callNewUser(user: User) {
    const stream = await this.getCurrentStream()
    this.currentPeer.call(user.peerId, stream)
  }
}