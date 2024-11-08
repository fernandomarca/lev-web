interface UserStreamProps {
    stream: MediaStream;
    isFake: boolean;
}

export default class UserStream {
    stream: MediaStream;
    isFake: boolean;
    constructor({ stream, isFake }: UserStreamProps) {
        this.stream = stream
        this.isFake = isFake
    }
}