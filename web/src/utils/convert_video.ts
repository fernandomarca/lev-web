import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export async function convertVideoToAudio(video: File) {
  console.log('Converting video to audio...')
  const ffmpeg = await getFFmpeg();

  await ffmpeg.writeFile('input.webm', await fetchFile(video));

  // ffmpeg.on('log', log => console.log(log));

  // ffmpeg.on('progress', progress => {
  //   console.log('Progress: ' + Math.round(progress.progress * 100));
  // });

  await ffmpeg.exec([
    '-i',
    'input.webm',
    '-map',
    '0:a',
    '-b:a',
    '20k',
    '-acodec',
    'libmp3lame',
    'output.mp3'
  ]);
  // ffmpeg -i test.mp4 -map 0:a -b:a 20k -acodec libmp3lame output.mp3

  const data = await ffmpeg.readFile('output.mp3');

  const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });

  const audioFile = new File([audioFileBlob], 'output.mp3', { type: 'audio/mpeg' });

  console.log('converted audio file');

  return audioFile;
}