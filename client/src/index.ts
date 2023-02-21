import path from "path";
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import { LEDManager } from './ledManager';
import { SoundPlayer } from './soundPlayer';

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

const alertsFirestore = firestore.collection(`stations/${stationId}/alerts`);
const alertsStorage = storage.bucket(bucketName);

const ledManager = new LEDManager();

let initialSnapshot = true;

let newDocumentsList: string[] = [];

const main = async () => {
  console.info(`Starting snapshot listener for station ${stationId} in project ${projectId}`)

  alertsFirestore.onSnapshot(async (snapshot) => {
    // Do not react on the initial snapshot event. This contains old alerts
    if (initialSnapshot) {
      initialSnapshot = false;
      return;
    }

    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        // Add new document to list of new documents
        newDocumentsList.push(change.doc.id);
        console.debug(`Adding doc ${change.doc.id} to newSnapshotList - Waiting for modification with bucketPath`)
      }

      // If the change is for a modified doc, check if it was added to the newDocumentsList
      // This prevents old alerts from being player again if they're getting updated
      if (change.type === "modified" && newDocumentsList.includes(change.doc.id)) {
        const data = change.doc.data();

        if (data.bucketPath) {
          // Remove the document from the newDocumentsList to prevent it being played again
          newDocumentsList = newDocumentsList.filter(el => el !== change.doc.id);
          
          ledManager.startFlashing();
          
          await SoundPlayer.playAlarm(data.gongType, data.bucketPath, alertsStorage);
        } else {
          console.debug(`Document ${change.doc.id} has no bucketPath set yet - Ignoring.`);
        }
      }
    }
  });
}

main().catch((err) => console.error(err));