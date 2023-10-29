import firebase from "firebase/app";
import 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDXEoaAnQ0nrdj5JIyfv1GMbgqz_3gXgMw",
  authDomain: "lith-harbor.firebaseapp.com",
  projectId: "lith-harbor",
  storageBucket: "lith-harbor.appspot.com",
  messagingSenderId: "583917238556",
  appId: "1:583917238556:web:9c38d3f4afe99bbd0de2d9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

export default db;