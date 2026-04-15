let cardEmEdicao = null;

async function escolherImagem() {
    const caminho = await window.electronAPI.selecionarImagem();
    if (caminho) {
        document.getElementById("inputImg").value = caminho;
        document.getElementById("nomeImagem").textContent = caminho.split("\\").pop(); // mostra só o nome do arquivo
    }
}
function abrirModal(){
    cardEmEdicao = null;
    document.getElementById("modalTitulo").textContent = "Nova Waifu";
    document.getElementById("btnConfirmar").textContent = "Adicionar";
    document.getElementById("inputNome").value = "";
    document.getElementById("inputImg").value = "";
    document.getElementById("inputTraits").value = "";
    document.getElementById("nomeImagem").textContent = "Nenhuma imagem escolhida";
    document.getElementById("modalOverlay").classList.add("open");
}

function abrirEdicao(card) {
    cardEmEdicao = card;
    document.getElementById("modalTitulo").textContent = "Editar Waifu";
    document.getElementById("btnConfirmar").textContent = "Salvar";
    document.getElementById("inputNome").value = card.querySelector(".card-nome").textContent;

    const imgAtual = card.querySelector("img") ? card.querySelector("img").src : "";
    document.getElementById("inputImg").value = imgAtual;
    document.getElementById("nomeImagem").textContent = imgAtual ? imgAtual.split("\\").pop().split("/").pop() : "Nenhuma imagem escolhida";

    document.getElementById("inputTraits").value = card.querySelector(".card-traits").textContent;
    document.getElementById("modalOverlay").classList.add("open");
}

function fecharModal(){
    document.getElementById("modalOverlay").classList.remove("open");
}

function fecharModalFora(event){
    if (event.target === document.getElementById("modalOverlay")) fecharModal();
}

function criarCard(nome, img, traits) {
    const card = document.createElement("div");
    card.className = "card";

    const imgHTML = img
        ? `<img src="${img}" alt="${nome}">`
        : `<div style="width:140px;height:190px;background:#6600aa;border-radius:8px;margin:0 auto;"></div>`;

    card.innerHTML = `
        ${imgHTML}
        <div class="card-nome">${nome}</div>
        <div class="card-traits">${traits}</div>
        <div class="card-botoes">
            <button class="btn-editar" onclick="abrirEdicao(this.closest('.card'))">Editar</button>
            <button class="btn-excluir" onclick="excluirCard(this.closest('.card'))">Deletar</button>
        </div>
    `;

    return card;
}

// Coleta todos os cards e salva no JSON
async function salvarNoJson() {
    const cards = document.querySelectorAll(".card");
    const dados = Array.from(cards).map(card => ({
        nome:   card.querySelector(".card-nome").textContent,
        img:    card.querySelector("img") ? card.querySelector("img").src : "",
        traits: card.querySelector(".card-traits").textContent
    }));
    await window.electronAPI.salvarWaifus(dados);
}

async function salvarWaifu(){
    const nome   = document.getElementById("inputNome").value.trim();
    const img    = document.getElementById("inputImg").value.trim();
    const traits = document.getElementById("inputTraits").value.trim();

    if (!nome) { alert("Digite o nome da waifu!"); return; }

    if (cardEmEdicao) {
        const imgEl = cardEmEdicao.querySelector("img");
        if (imgEl) imgEl.src = img;
        cardEmEdicao.querySelector(".card-nome").textContent = nome;
        cardEmEdicao.querySelector(".card-traits").textContent = traits;
    } else {
        document.getElementById("cardsContainer").appendChild(criarCard(nome, img, traits));
    }

    await salvarNoJson();
    fecharModal();
}

async function excluirCard(card) {
    if (confirm("Tem certeza que deseja remover essa waifu?")) {
        card.style.transition = "opacity 0.3s, transform 0.3s";
        card.style.opacity = 0;
        card.style.transform = "scale(0.9)";
        setTimeout(async () => {
            card.remove();
            await salvarNoJson();
        }, 300);
    }
}

// Carrega as waifus do JSON ao iniciar
async function carregarWaifus() {
    const lista = await window.electronAPI.lerWaifus();
    lista.forEach(w => {
        document.getElementById("cardsContainer").appendChild(criarCard(w.nome, w.img, w.traits));
    });
}

carregarWaifus();