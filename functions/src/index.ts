import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();

export const ttsGen = functions
  .region('europe-west1')
  .firestore
  .document('alerts/{alertId}')
  .onCreate((snapshot) => {
    console.log(snapshot);

    const ttsBucket = admin.storage().bucket('tts');

    ttsBucket.file('test.txt').save('foobar');
  });