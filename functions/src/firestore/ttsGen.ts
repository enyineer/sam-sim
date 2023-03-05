import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import tts from "@google-cloud/text-to-speech";
import * as hash from "object-hash";
import { writeFile } from "fs/promises";
import * as admin from "firebase-admin";

export const ttsGenFunction = async (snapshot: QueryDocumentSnapshot) => {
  const ttsClient = new tts.TextToSpeechClient();

  const data = snapshot.data();
  const ttsText = data.ttsText;

  if (ttsText === undefined) {
    throw new Error(`ttsText of doc ${snapshot.id} was undefined`);
  }

  if (ttsText === "") {
    console.debug(
      `Skipping ttsGen for doc ${snapshot.id} because ttsText was empty`
    );
    return;
  }

  const ttsTextHash = hash(ttsText);

  const ttsBucket = admin.storage().bucket();
  const bucketPath = `alarms/${ttsTextHash}.mp3`;

  // Check if bucket already has the text as speech synthesis
  const file = ttsBucket.file(bucketPath);
  const fileExists = await file.exists();
  if (fileExists[0]) {
    console.debug(
      `tts File for document ${snapshot.id} with text ${ttsText} already exists. Updating snapshot with existing storage path`
    );
    await snapshot.ref.update({
      ...data,
      bucketPath,
    });
  } else {
    console.debug(
      `tts File for document ${snapshot.id} with text ${ttsText} doesn't exists. Generating and updating snapshot with new storage path`
    );
    const [response] = await ttsClient.synthesizeSpeech({
      audioConfig: {
        audioEncoding: "MP3",
      },
      input: {
        text: ttsText,
      },
      voice: {
        languageCode: "de-DE",
        name: "de-DE-Wavenet-C",
      },
    });

    const audioContent = response.audioContent;

    if (
      audioContent === undefined ||
      audioContent === null ||
      typeof audioContent === "string"
    ) {
      throw new Error(
        `audioContent for document ${
          snapshot.id
        } was of invalid type ${typeof audioContent} for ttsText ${ttsText}`
      );
    }

    const localPath = `/tmp/${ttsTextHash}.mp3`;

    await writeFile(localPath, audioContent);

    await ttsBucket.upload(localPath, {
      resumable: false,
      contentType: "audio/mpeg3",
      destination: bucketPath,
    });

    await snapshot.ref.update({
      ...data,
      bucketPath,
    });
  }
};
