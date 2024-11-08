export default class Media {
    async getUserAudio(audio = true, video = true) {
        return navigator.mediaDevices.getUserMedia({
            audio,
            video
        })
    }

    createMediaStreamFake() {
        return new MediaStream([
            Media._createEmptyAudioTrack()
        ])
    }

    static _createEmptyAudioTrack() {
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        const destination = oscillator.connect(audioContext.createMediaStreamDestination())
        oscillator.start()
        // @ts-ignore
        const [track] = destination.stream.getAudioTracks()

        return Object.assign(track, { enabled: false })
    }
}