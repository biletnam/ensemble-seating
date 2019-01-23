import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
// Initialize Firebase
const config = {
    apiKey: "AIzaSyAUCAYvc1OmnSYWXsnSzEnZetjQINrkHO8",
    authDomain: "ensemble-seating.firebaseapp.com",
    databaseURL: "https://ensemble-seating.firebaseio.com",
    projectId: "ensemble-seating",
    storageBucket: "ensemble-seating.appspot.com",
    messagingSenderId: "30759784773"
};
firebase.initializeApp(config);

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default firebase;