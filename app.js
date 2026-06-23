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
const buscaCifra = document.getElementById("buscaCifra");
const painelLider = document.getElementById("painelLider");
const tituloPainel = document.getElementById("tituloPainel");
const btnAbrir = document.getElementById("btnAbrir");
const btnAnterior = document.getElementById("btnAnterior");
const btnProxima = document.getElementById("btnProxima");
const infoPagina = document.getElementById("infoPagina");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

const parametros = new URLSearchParams(window.location.search);
const modoLider = parametros.get("modo") === "lider";

let pdfDoc = null;
let ultimoEstado = null;

if (modoLider) {
  tituloPainel.innerText = "Painel do Líder";
  painelLider.style.display = "block";
} else {
  tituloPainel.innerText = "Painel do Músico";
  painelLider.style.display = "none";
}

let todasCifras = [];

async function carregarCifras() {
 const resposta = await fetch("/cifras.json");
  todasCifras = await resposta.json();

  atualizarLista(todasCifras);
}

function atualizarLista(lista) {
  pdfSelect.innerHTML = "";

  lista.forEach(cifra => {
    const option = document.createElement("option");
    option.value = cifra.arquivo;
    option.textContent = cifra.nome;
    pdfSelect.appendChild(option);
  });

  if (lista.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Nenhuma cifra encontrada";
    option.disabled = true;
    pdfSelect.appendChild(option);
  }
}
}
  const resposta = await fetch("/cifras.json");
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
if (buscaCifra) {
  buscaCifra.addEventListener("input", () => {
    const texto = buscaCifra.value.toLowerCase();

    const filtradas = todasCifras.filter(cifra =>
      cifra.nome.toLowerCase().includes(texto)
    );

    atualizarLista(filtradas);
  });
}

async function renderizarPDF(arquivo, pagina) {
  try {
    pdfDoc = await pdfjsLib.getDocument(`/pdfs/${arquivo}`).promise;

    if (pagina < 1) pagina = 1;
    if (pagina > pdfDoc.numPages) pagina = pdfDoc.numPages;

    const page = await pdfDoc.getPage(pagina);
    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    infoPagina.innerText = `Página ${pagina} de ${pdfDoc.numPages}`;
  } catch (erro) {
    console.error(erro);
    infoPagina.innerText = "Erro ao carregar a cifra.";
  }
}

btnAbrir.addEventListener("click", async () => {
  await set(ref(db, "sala"), {
    pdf: pdfSelect.value,
    pagina: 1
  });
});

btnAnterior.addEventListener("click", async () => {
  if (!ultimoEstado) return;

  const atual = ultimoEstado.pagina || 1;
  if (atual <= 1) return;

  await set(ref(db, "sala"), {
    pdf: ultimoEstado.pdf,
    pagina: atual - 1
  });
});

btnProxima.addEventListener("click", async () => {
  if (!ultimoEstado) return;

  const atual = ultimoEstado.pagina || 1;

  await set(ref(db, "sala"), {
    pdf: ultimoEstado.pdf,
    pagina: atual + 1
  });
});

onValue(ref(db, "sala"), async (snapshot) => {
  const dados = snapshot.val();

  if (!dados) return;

  ultimoEstado = dados;

  await renderizarPDF(dados.pdf, dados.pagina);
});
