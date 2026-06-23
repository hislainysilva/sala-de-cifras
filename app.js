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

const pdfSelect = document.getElementById("pdfSelect");
async function carregarCifras() {
  const resposta = await fetch("cifras.json");
  const cifras = await resposta.json();

  pdfSelect.innerHTML = "";

  cifras.forEach(cifra => {
    const option = document.createElement("option");
    option.value = cifra.arquivo;
    option.textContent = cifra.nome;
    pdfSelect.appendChild(option);
  });
}

carregarCifras();
const btnAbrir = document.getElementById("btnAbrir");
const btnAnterior = document.getElementById("btnAnterior");
const btnProxima = document.getElementById("btnProxima");
const infoPagina = document.getElementById("infoPagina");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

let pdfDoc = null;

async function renderizarPDF(arquivo, pagina) {
  try {
    pdfDoc = await pdfjsLib.getDocument(`pdfs/${arquivo}`).promise;

    const page = await pdfDoc.getPage(pagina);

    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    infoPagina.innerText = `Página ${pagina}`;
  } catch (erro) {
    console.error(erro);
  }
}

btnAbrir.addEventListener("click", async () => {
  await set(ref(db, "sala"), {
    pdf: pdfSelect.value,
    pagina: 1
  });
});

btnAnterior.addEventListener("click", async () => {
  const atual = ultimoEstado?.pagina || 1;

  if (atual <= 1) return;

  await set(ref(db, "sala"), {
    pdf: ultimoEstado.pdf,
    pagina: atual - 1
  });
});

btnProxima.addEventListener("click", async () => {
  const atual = ultimoEstado?.pagina || 1;

  await set(ref(db, "sala"), {
    pdf: ultimoEstado.pdf,
    pagina: atual + 1
  });
});

let ultimoEstado = null;

onValue(ref(db, "sala"), async (snapshot) => {
  const dados = snapshot.val();

  if (!dados) return;

  ultimoEstado = dados;

  await renderizarPDF(
    dados.pdf,
    dados.pagina
  );
});
