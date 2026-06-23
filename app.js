import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyxtLhpl0DyA_DZLh20oZ9Pa-A9jtKLx0",
  authDomain: "sala-de-cifras.firebaseapp.com",
  databaseURL: "https://sala-de-cifras-default-rtdb.firebaseio.com",
  projectId: "sala-de-cifras",
  storageBucket: "sala-de-cifras.firebasestorage.app",
  messagingSenderId: "1058844486174",
  appId: "1:1058844486174:web:93675ab71293f38ebadc0f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const viewer = document.getElementById("pdfViewer");

window.abrirCifra = function(pdf) {
  set(ref(db, "salaAtual"), {
    pdf: pdf
  });
};

onValue(ref(db, "salaAtual"), (snapshot) => {
  const dados = snapshot.val();

  if (!dados) return;

  viewer.src = "pdfs/" + dados.pdf;
});
