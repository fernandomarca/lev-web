import { MediaConnection, Peer, PeerOptions } from "peerjs";

interface PeerCustomModuleConfig {
  config: PeerOptions;
  onCall: (call: MediaConnection) => void;
}

export class PeerCustomModule extends Peer {
  onCall: (call: MediaConnection) => void;
  constructor({ config, onCall }: PeerCustomModuleConfig) {
    super(config)

    this.onCall = onCall
  }

  // @ts-ignore
  call(...args) {
    // @ts-ignore
    const originalCallResult = super.call(...args)

    this.onCall(originalCallResult)

    return originalCallResult
  }
}


export default class PeerBuilder {
  peerConfig: PeerOptions;
  onError: () => void;
  onConnectionOpened: (peer: Peer) => void;
  onCallError: (call: MediaConnection, error: Error) => void;
  onCallClose: (call: MediaConnection) => void;
  onCallReceived: (call: MediaConnection) => void;
  onStreamReceived: (call: MediaConnection, stream: MediaStream) => void;

  constructor(opts: PeerOptions = {}) {
    this.peerConfig = opts;
    this.onError = () => { };
    this.onConnectionOpened = () => { };
    this.onCallError = () => { };
    this.onCallClose = () => { };
    this.onCallReceived = () => { };
    this.onStreamReceived = () => { };
  }

  setOnError(fn: () => void) {
    this.onError = fn;
    return this
  }

  setOnConnectionOpened(fn: (peer: Peer) => void) {
    this.onConnectionOpened = fn;
    return this
  }

  setOnCallError(fn: () => void) {
    this.onCallError = fn
    return this
  }

  setOnCallClose(fn: () => void) {
    this.onCallClose = fn
    return this
  }

  setOnCallReceived(fn: () => void) {
    this.onCallReceived = fn
    return this
  }

  setOnStreamReceived(fn: () => void) {
    this.onStreamReceived = fn
    return this
  }

  _prepareCallEvent(call: MediaConnection) {
    call.on('stream', (stream: MediaStream) => this.onStreamReceived(call, stream))
    call.on('error', (error: Error) => this.onCallError(call, error))
    call.on('close', () => this.onCallClose(call))

    this.onCallReceived(call)
  }

  async build(): Promise<Peer> {
    // const peer = new Peer(this.peerConfig);
    const peer = new PeerCustomModule({
      config: this.peerConfig,
      onCall: this._prepareCallEvent.bind(this)
    })
    peer.on('error', this.onError);
    peer.on('call', this._prepareCallEvent.bind(this));

    return new Promise((resolve) => peer.on('open', () => {
      this.onConnectionOpened(peer)
      return resolve(peer);
    }))
  }
}