import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import tts from "@google-cloud/text-to-speech";

admin.initializeApp();

export const ttsGen = functions
  .region('europe-west1')
  .firestore
  .document('alerts/{alertId}')
  .onCreate(async (snapshot) => {
    const ttsClient = new tts.TextToSpeechClient();

    const data = snapshot.data();

    const [response] = await ttsClient.synthesizeSpeech({
      audioConfig: {
        audioEncoding: 'MP3',
      },
      input: {
        text: data.ttsText,
      },
      voice: {
        languageCode: 'de-DE',
        name: 'de-DE-Neural2-D',
      }
    });

    console.log(response);

    // const ttsBucket = admin.storage().bucket();

    // await ttsBucket.file(`alerts/${snapshot.id}.mp3`).save(response.audioContent);
  });