import { GongType } from 'sam-common/dist';
import path from "path";
import SoundPlay from "sound-play";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { Bucket } from '@google-cloud/storage';

export class SoundPlayer {
  static async playAlarm(gongType: GongType, bucketPath: string, bucket: Bucket) {
    const localPath = await this.downloadTtsFile(bucketPath, bucket);
    await this.playGong(gongType);
    await this.playTtsFile(localPath);
  }

  private static async playGong(gongType: GongType) {
    let gongPath = this.getGongPath(gongType);

    if (!existsSync(gongPath)) {
      throw new Error(`Could not find Gong ${gongType} at path ${gongPath}`);
    }

    console.debug(`Playing Gong ${gongType} from ${gongPath}`);

    await SoundPlay.play(gongPath);
  }

  private static getGongPath(gongType: GongType) {
    switch(gongType) {
      case GongType.LONG:
        return path.join(__dirname, "assets", "gong-long.wav");
      default:
        throw new Error(`No file mapping for GongType ${gongType}`);
    }
  }

  private static async downloadTtsFile(bucketPath: string, bucket: Bucket) {
    const file = bucket.file(bucketPath);
    const cachePath = path.join(__dirname, "..", "cache");
    const localPath = path.join(cachePath, file.name);
    
    if (!existsSync(localPath)) {
      console.debug(`File ${file.name} does not exist. Downloading from Storage.`);
      await mkdir(path.dirname(localPath), { recursive: true });
      const [mp3] = await file.download();
      await writeFile(localPath, mp3, );
    } else {
      console.debug(`File ${file.name} already existed. Returning cache path.`);
    }

    return localPath;
  }

  private static async playTtsFile(localPath: string) {
    console.debug(`Playing tts file ${localPath}`);
    await SoundPlay.play(localPath);
  }
}