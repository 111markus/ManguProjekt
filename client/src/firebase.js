import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCIGx7yeh1lfI4CU9ZtWGQEwVKvpToO4XQ",
  authDomain: "react-aim.firebaseapp.com",
  databaseURL: "https://react-aim-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "react-aim",
  storageBucket: "react-aim.firebasestorage.app",
  messagingSenderId: "1078261746790",
  appId: "1:1078261746790:web:853392e5ce201c91e8b1a7",
  measurementId: "G-444HC8CZNB"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
