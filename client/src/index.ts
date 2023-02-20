import SoundPlay from "sound-play";
import path from "path";
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

const firestore = new Firestore();
const storage = new Storage();

const alertsFirestore = firestore.collection('alerts');
const alertsStorage = storage.bucket('default');

const main = async () => {
  const gongPath = path.join(__dirname, "assets", "gong.wav");

  const play = await SoundPlay.play(gongPath);

  console.log(play);
}

main().catch((err) => console.error(err));