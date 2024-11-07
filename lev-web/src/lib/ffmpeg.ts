import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null

export async function getFFmpeg() {

  if (ffmpeg) return ffmpeg

  const coreURL = await toBlobURL('../ffmpeg/ffmpeg-core.js', 'text/javascript')
  const wasmURL = await toBlobURL('../ffmpeg/ffmpeg-core.wasm', 'application/wasm')
  const workerURL = await toBlobURL('../ffmpeg/ffmpeg-worker.js', 'text/javascript')

  ffmpeg = new FFmpeg()

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL
    })
  }

  return ffmpeg
}

