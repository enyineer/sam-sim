import SoundPlay from "sound-play";
import path from "path";
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.GOOGLE_PROJECT_ID;
const saKeyName = process.env.GOOGLE_SA_NAME;

if (projectId === undefined) {
  throw new Error(`GOOGLE_PROJECT_ID not set.`);
}

if (saKeyName === undefined) {
  throw new Error('GOOGLE_SA_NAME not set.');
}

const saKeyPath = path.join(__dirname, '..', 'serviceAccount', saKeyName);

if (!existsSync(saKeyPath)) {
  throw new Error(`Could not find SA Key File at ${saKeyPath}`);
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

const alertsFirestore = firestore.collection('alerts');
const alertsStorage = storage.bucket('sam-sim-prod.appspot.com');

const gongPath = path.join(__dirname, "assets", "gong.wav");

const main = async () => {
  await mkdir(cachePath, { recursive: true });

  alertsFirestore.onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "modified" || change.type === "added") {
        const data = change.doc.data();

        if (data.bucketPath) {
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
          
          await SoundPlay.play(gongPath);
          await SoundPlay.play(localPath);
        } else {
          console.debug(`Document ${change.doc.id} has no bucketPath set yet - Ignoring.`);
        }
      }
    }
  });
}

main().catch((err) => console.error(err));