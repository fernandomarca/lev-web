import fs from 'node:fs';
import path from 'node:path';

export function getAudioFiles(directory: string) {
  return fs.readdirSync(directory).filter(file => {
    return ['.webm', '.mp3', '.m4a'].includes(path.extname(file).toLowerCase());
  }).map(file => `${directory}/${file}`);
}