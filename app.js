import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  remove,
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

const parametros = new URLSearchParams(window.location.search);
const modo = parametros.get("modo") || "musico";

const modoLider = modo === "lider";
const modoAdmin = modo === "admin";
const modoMusico = !modoLider && !modoAdmin;

const SENHA_LIDER = "louvor2025";
const SENHA_ADMIN = "admin2025";

const telaLogin = document.getElementById("telaLogin");
const tituloLogin = document.getElementById("tituloLogin");
const senhaLogin = document.getElementById("senhaLogin");
const btnEntrarLogin = document.getElementById("btnEntrarLogin");
const erroLogin = document.getElementById("erroLogin");

const painelAdmin = document.getElementById("painelAdmin");
const painelLider = document.getElementById("painelLider");
const tituloPainel = document.getElementById("tituloPainel");

const pdfSelect = document.getElementById("pdfSelect");
const buscaCifra = document.getElementById("buscaCifra");

const btnAbrir = document.getElementById("btnAbrir");
const btnAnterior = document.getElementById("btnAnterior");
const btnProxima = document.getElementById("btnProxima");

const nomeNovaCifra = document.getElementById("nomeNovaCifra");
const arquivoNovaCifra = document.getElementById("arquivoNovaCifra");
const btnAdicionarCifra = document.getElementById("btnAdicionarCifra");
const mensagemAdmin = document.getElementById("mensagemAdmin");

const infoPagina = document.getElementById("infoPagina");
const tituloMusica =
    document.getElementById("tituloMusica"); 
const telaBoasVindas = document.getElementById("telaBoasVindas");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

let pdfDoc = null;
let ultimoEstado = null;
let cifrasFixas = [];
let cifrasAdmin = [];
let todasCifras = [];

function mostrarBoasVindas() {
  if (modoMusico && telaBoasVindas) {
    telaBoasVindas.style.display = "flex";
  }

  if (canvas) {
    canvas.style.display = "none";
  }
}

function esconderBoasVindas() {
  if (telaBoasVindas) {
    telaBoasVindas.style.display = "none";
  }

  if (canvas) {
    canvas.style.display = "block";
  }
}

function configurarInterface() {
  document.body.classList.remove("modo-lider", "modo-admin", "modo-musico");

  painelAdmin.style.display = "none";
  painelLider.style.display = "none";

  if (modoLider) {
    document.body.classList.add("modo-lider");
    tituloPainel.innerText = "Painel do Líder";
    painelLider.style.display = "block";
    esconderBoasVindas();
  } else if (modoAdmin) {
    document.body.classList.add("modo-admin");
    tituloPainel.innerText = "Administração";
    painelAdmin.style.display = "block";
    esconderBoasVindas();
  } else {
    document.body.classList.add("modo-musico");
    tituloPainel.innerText = "Painel do Músico";
    mostrarBoasVindas();
  }
}

function liberarAcesso() {
  telaLogin.style.display = "none";
  configurarInterface();
}

function iniciarLogin() {
  if (modoLider || modoAdmin) {
    telaLogin.style.display = "flex";

    tituloLogin.innerText = modoLider
      ? "Acesso do Líder"
      : "Acesso do Administrador";

    btnEntrarLogin.addEventListener("click", () => {
      const senhaDigitada = senhaLogin.value;

      if (modoLider && senhaDigitada === SENHA_LIDER) {
        liberarAcesso();
      } else if (modoAdmin && senhaDigitada === SENHA_ADMIN) {
        liberarAcesso();
      } else {
        erroLogin.innerText = "Senha incorreta!";
      }
    });

    senhaLogin.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        btnEntrarLogin.click();
      }
    });
  } else {
    telaLogin.style.display = "none";
    liberarAcesso();
  }
}

async function carregarCifrasFixas() {
  try {
    const resposta = await fetch("/cifras.json");
    cifrasFixas = await resposta.json();
    juntarCifras();
  } catch (erro) {
    console.error("Erro ao carregar cifras.json:", erro);
    cifrasFixas = [];
    juntarCifras();
  }
}

function carregarCifrasAdmin() {
  onValue(ref(db, "cifras"), (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
      cifrasAdmin = [];
    } else {
      cifrasAdmin = Object.entries(dados).map(([id, cifra]) => ({
        id,
        ...cifra,
        origem: "admin"
      }));
    }

    juntarCifras();
    mostrarCifrasAdmin();
  });
}

function juntarCifras() {
  const fixasComOrigem = cifrasFixas.map(cifra => ({
    ...cifra,
    origem: "json"
  }));

  todasCifras = [...fixasComOrigem, ...cifrasAdmin];

  todasCifras.sort((a, b) => a.nome.localeCompare(b.nome));

  atualizarLista(todasCifras);
}

function atualizarLista(lista) {
  if (!pdfSelect) return;

  pdfSelect.innerHTML = "";

  lista.forEach(cifra => {
    const option = document.createElement("option");
   option.value = cifra.arquivo;
option.textContent = cifra.nome;
option.dataset.nome = cifra.nome;
    pdfSelect.appendChild(option);
  });

  if (lista.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Nenhuma cifra encontrada";
    option.disabled = true;
    pdfSelect.appendChild(option);
  }
}

function mostrarCifrasAdmin() {
  if (!painelAdmin) return;

  let listaAdmin = document.getElementById("listaCifrasAdmin");

  if (!listaAdmin) {
    listaAdmin = document.createElement("div");
    listaAdmin.id = "listaCifrasAdmin";
    painelAdmin.appendChild(listaAdmin);
  }

  listaAdmin.innerHTML = "<h3>Cifras adicionadas pelo Admin</h3>";

  if (cifrasAdmin.length === 0) {
    listaAdmin.innerHTML += "<p>Nenhuma cifra adicionada pelo Admin.</p>";
    return;
  }

  cifrasAdmin.forEach(cifra => {
    const item = document.createElement("div");
    item.className = "item-cifra-admin";

    item.innerHTML = `
      <span>${cifra.nome}</span>
      <button class="btn-excluir" data-id="${cifra.id}">Excluir</button>
    `;

    listaAdmin.appendChild(item);
  });

  document.querySelectorAll(".btn-excluir").forEach(botao => {
    botao.addEventListener("click", async () => {
      const id = botao.getAttribute("data-id");

      const confirmar = confirm("Tem certeza que deseja excluir esta cifra?");
      if (!confirmar) return;

      await remove(ref(db, "cifras/" + id));
      mensagemAdmin.innerText = "Cifra excluída com sucesso!";
    });
  });
}

if (buscaCifra) {
  buscaCifra.addEventListener("input", () => {
    const texto = buscaCifra.value.toLowerCase();

    const filtradas = todasCifras.filter(cifra =>
      cifra.nome.toLowerCase().includes(texto)
    );

    atualizarLista(filtradas);
  });
}

if (btnAdicionarCifra) {
  btnAdicionarCifra.addEventListener("click", async () => {
    const nome = nomeNovaCifra.value.trim();
    const arquivo = arquivoNovaCifra.value.trim();

    if (!nome || !arquivo) {
      mensagemAdmin.innerText = "Preencha o nome da música e o nome do PDF.";
      return;
    }

    await push(ref(db, "cifras"), {
      nome,
      arquivo
    });

    nomeNovaCifra.value = "";
    arquivoNovaCifra.value = "";
    mensagemAdmin.innerText = "Cifra adicionada com sucesso!";
  });
}

async function renderizarPDF(arquivo, pagina) {
    try {
    pdfDoc = await pdfjsLib.getDocument(`/pdfs/${arquivo}`).promise;
const cifraAtual =
    todasCifras.find(
        c => c.arquivo === arquivo
    );

if(cifraAtual && tituloMusica){

    tituloMusica.innerText =
        cifraAtual.nome;

    tituloMusica.style.display =
        "block";
}
    esconderBoasVindas();

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
    console.error("Erro ao carregar PDF:", erro);
    infoPagina.innerText = "Erro ao carregar a cifra.";

    if (modoMusico) {
      mostrarBoasVindas();
    }
  }
}

if (btnAbrir) {
  btnAbrir.addEventListener("click", async () => {
    if (!pdfSelect.value) return;

    await set(ref(db, "sala"), {
      pdf: pdfSelect.value,
      pagina: 1
    });
  });
}

if (btnAnterior) {
  btnAnterior.addEventListener("click", async () => {
    if (!ultimoEstado) return;

    const atual = ultimoEstado.pagina || 1;
    if (atual <= 1) return;

    await set(ref(db, "sala"), {
      pdf: ultimoEstado.pdf,
      pagina: atual - 1
    });
  });
}

if (btnProxima) {
  btnProxima.addEventListener("click", async () => {
    if (!ultimoEstado) return;

    const atual = ultimoEstado.pagina || 1;

    await set(ref(db, "sala"), {
      pdf: ultimoEstado.pdf,
      pagina: atual + 1
    });
  });
}

let primeiraAberturaMusico = true;

onValue(ref(db, "sala"), async (snapshot) => {
  const dados = snapshot.val();

  if (!dados) return;

  ultimoEstado = dados;

  if (modoMusico && primeiraAberturaMusico) {
    primeiraAberturaMusico = false;

    mostrarBoasVindas();

    setTimeout(async () => {
      await renderizarPDF(dados.pdf, dados.pagina);
    }, 3000);

    return;
  }

  await renderizarPDF(dados.pdf, dados.pagina);
});

iniciarLogin();
carregarCifrasFixas();
carregarCifrasAdmin();
