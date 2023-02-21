import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import tts from "@google-cloud/text-to-speech";
import * as hash from "object-hash";
import { writeFile } from "fs/promises";

admin.initializeApp();

export const ttsGen = functions
  .region('europe-west1')
  .firestore
  .document('stations/{stationId}/alerts/{alertId}')
  .onCreate(async (snapshot) => {
    const ttsClient = new tts.TextToSpeechClient();

    const data = snapshot.data();
    const ttsText = data.ttsText;
    const ttsTextHash = hash(ttsText);

    const ttsBucket = admin.storage().bucket();
    const bucketPath = `alerts/${ttsTextHash}.mp3`;

    // Check if bucket already has the text as speech synthesis
    const file = ttsBucket.file(bucketPath);
    const fileExists = await file.exists();
    if (fileExists[0]) {
      console.debug(`tts File for document ${snapshot.id} with text ${ttsText} already exists. Updating snapshot with existing storage path.`);
      await snapshot.ref.update({
        ...data,
        bucketPath,
      });
    } else {
      console.debug(`tts File for document ${snapshot.id} with text ${ttsText} doesn't exists. Generating and updating snapshot with new storage path.`);
      const [response] = await ttsClient.synthesizeSpeech({
        audioConfig: {
          audioEncoding: 'MP3',
        },
        input: {
          text: ttsText,
        },
        voice: {
          languageCode: 'de-DE',
          name: 'de-DE-Neural2-D',
        }
      });
  
      const audioContent = response.audioContent;
  
      if (audioContent === undefined || audioContent === null || typeof audioContent === 'string') {
        throw new Error(`audioContent for document ${snapshot.id} was of invalid type ${typeof audioContent} for ttsText ${ttsText}`);
      }

      const localPath = `/tmp/${ttsTextHash}.mp3`;

      await writeFile(localPath, audioContent);

      await ttsBucket.upload(localPath, {
        resumable: false,
        contentType: 'audio/mpeg3',
        destination: bucketPath,
      });
  
      await snapshot.ref.update({
        ...data,
        bucketPath,
      });
    }
  });
