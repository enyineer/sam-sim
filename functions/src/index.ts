import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import tts from "@google-cloud/text-to-speech";
import * as hash from "object-hash";

admin.initializeApp();

export const ttsGen = functions
  .region('europe-west1')
  .firestore
  .document('alerts/{alertId}')
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
  
      if (audioContent === undefined || audioContent === null) {
        throw new Error(`audioContent for document ${snapshot.id} was undefined for ttsText ${ttsText}`);
      }
  
      await ttsBucket.file(bucketPath).save(audioContent.toString());
  
      await snapshot.ref.update({
        ...data,
        bucketPath,
      });
    }
  });