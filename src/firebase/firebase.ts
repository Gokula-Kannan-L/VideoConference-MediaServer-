import { initializeApp } from "firebase/app";
import {child, getDatabase, ref} from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyC8GFdQ-O_kVnY_MNerx6Q7s7C7v24Mq1Q",
    databaseURL: "https://videoconference-49401-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

export const InitialiseFirebase = (path: string) => {
    const firebase = initializeApp(firebaseConfig);
    let dbRef = ref(getDatabase(firebase));
    return child(dbRef, path);
}