import fs from 'node:fs';
import path from 'node:path';

export function getAudioFiles(directory: string) {
  return fs.readdirSync(directory).filter(file => {
    return ['.mp3'].includes(path.extname(file).toLowerCase());
  }).map(file => `${directory}/${file}`);
}