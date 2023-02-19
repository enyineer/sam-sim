import * as functions from 'firebase-functions';

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const ttsGen = functions
  .region('us-central1')
  .firestore
  .document('alert/{alertId}')
  .onCreate((snapshot, context) => {
    console.log(snapshot);
    console.log(context.auth);
  });
