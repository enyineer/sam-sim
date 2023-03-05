import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { app } from './https/express';
import { ttsGenFunction } from './firestore/ttsGen';

admin.initializeApp();

export const trpc = functions
  .region('europe-west1')
  .https
  .onRequest(app);

export const ttsGen = functions
  .region('europe-west1')
  .firestore
  .document('stations/{stationId}/alarms/{alarmId}')
  .onCreate(ttsGenFunction);
