import SoundPlay from "sound-play";
import path from "path";
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { LEDManager } from './ledManager';
import { GongType } from 'sam-common/dist';

dotenv.config();

const projectId = process.env.GOOGLE_PROJECT_ID;
const saKeyName = process.env.GOOGLE_SA_NAME;
const bucketName = process.env.BUCKET_NAME;
const stationId = process.env.FIRESTORE_STATION_ID;

if (projectId === undefined) {
  throw new Error(`GOOGLE_PROJECT_ID not set.`);
}

if (saKeyName === undefined) {
  throw new Error('GOOGLE_SA_NAME not set.');
}

const saKeyPath = path.join(__dirname, '..', 'serviceAccount', saKeyName);

if (bucketName === undefined) {
  throw new Error(`BUCKET_NAME not set.`);
}

if (stationId === undefined) {
  throw new Error(`FIRESTORE_STATION_ID not set.`);
}

const firestore = new Firestore({
  projectId,
  keyFilename: saKeyPath,
});

const storage = new Storage({
  projectId,
  keyFilename: saKeyPath,
});

const cachePath = path.join(__dirname, "..", "cache");

const alertsFirestore = firestore.collection(`stations/${stationId}/alerts`);
const alertsStorage = storage.bucket(bucketName);

const ledManager = new LEDManager();

let initialSnapshot = true;

let newSnapshotList: string[] = [];

const main = async () => {
  await mkdir(cachePath, { recursive: true });

  alertsFirestore.onSnapshot(async (snapshot) => {
    // Do not react on the initial snapshot event. This contains old alerts
    if (initialSnapshot) {
      initialSnapshot = false;
      return;
    }

    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        newSnapshotList.push(change.doc.id);
        console.debug(`Adding doc ${change.doc.id} to newSnapshotList - Waiting for modification with bucketPath`)
      }

      if (change.type === "modified" && newSnapshotList.includes(change.doc.id)) {
        const data = change.doc.data();

        if (data.bucketPath) {
          newSnapshotList = newSnapshotList.filter(el => el !== change.doc.id);
          const file = alertsStorage.file(data.bucketPath);
          const localPath = path.join(cachePath, file.name);

          if (!existsSync(localPath)) {
            console.debug(`File ${file.name} does not exist. Downloading from Storage.`);
            await mkdir(path.dirname(localPath), { recursive: true });
            const [mp3] = await file.download();
            await writeFile(localPath, mp3, );
          } else {
            console.debug(`File ${file.name} already existed. Playing from Cache.`);
          }

          ledManager.startFlashing();
          
          switch(data.gongType) {
            case GongType.LONG:
              const gongPath = path.join(__dirname, "assets", "gong.wav");
              await SoundPlay.play(gongPath);
              break;
            default:
              throw new Error(`No file mapping for GongType ${data.gongType}`);
          }
          
          await SoundPlay.play(localPath);
        } else {
          console.debug(`Document ${change.doc.id} has no bucketPath set yet - Ignoring.`);
        }
      }
    }
  });
}

main().catch((err) => console.error(err));