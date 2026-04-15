let personagens = [];
let personagemAtualId = null;
let cardEmEdicao = null;
let personagemEmEdicaoId = null;
let menuAberto = true;

// ==================== MENU ====================
function toggleMenu() {
    menuAberto = !menuAberto;
    document.getElementById("sidebar").classList.toggle("fechado", !menuAberto);
    document.getElementById("conteudo").classList.toggle("expandido", !menuAberto);
    document.getElementById("btnReabrirMenu").style.display = menuAberto ? "none" : "block";
}

// ==================== PERSONAGENS ====================
function abrirModalPersonagem(id = null) {
    personagemEmEdicaoId = id;
    const titulo = document.getElementById("modalPersonagemTitulo");
    const btnConfirmar = document.getElementById("btnConfirmarPersonagem");

    if (id) {
        const p = personagens.find(p => p.id === id);
        titulo.textContent = "Editar Personagem";
        btnConfirmar.textContent = "Salvar";
        document.getElementById("inputNomePersonagem").value = p.nome;
        document.getElementById("inputAvatar").value = p.avatar || "";
        document.getElementById("nomeAvatar").textContent = p.avatar ? p.avatar.split("\\").pop().split("/").pop() : "Nenhuma imagem escolhida";
        document.getElementById("inputBio").value = p.bio || "";
    } else {
        titulo.textContent = "Novo Personagem";
        btnConfirmar.textContent = "Criar";
        document.getElementById("inputNomePersonagem").value = "";
        document.getElementById("inputAvatar").value = "";
        document.getElementById("nomeAvatar").textContent = "Nenhuma imagem escolhida";
        document.getElementById("inputBio").value = "";
    }

    document.getElementById("modalPersonagemOverlay").classList.add("open");
}

function fecharModalPersonagem() {
    document.getElementById("modalPersonagemOverlay").classList.remove("open");
}

function fecharModalPersonagemFora(event) {
    if (event.target === document.getElementById("modalPersonagemOverlay")) fecharModalPersonagem();
}

async function escolherAvatar() {
    const caminho = await window.electronAPI.selecionarImagem();
    if (caminho) {
        document.getElementById("inputAvatar").value = caminho;
        document.getElementById("nomeAvatar").textContent = caminho.split("\\").pop();
    }
}

async function salvarPersonagem() {
    const nome  = document.getElementById("inputNomePersonagem").value.trim();
    const avatar = document.getElementById("inputAvatar").value.trim();
    const bio   = document.getElementById("inputBio").value.trim();

    if (!nome) { alert("Digite o nome do personagem!"); return; }

    if (personagemEmEdicaoId) {
        const p = personagens.find(p => p.id === personagemEmEdicaoId);
        p.nome = nome;
        p.avatar = avatar;
        p.bio = bio;
    } else {
        personagens.push({
            id: Date.now().toString(),
            nome,
            avatar,
            bio,
            waifus: []
        });
    }

    await salvarDados();
    renderizarMenuPersonagens();

    if (personagemEmEdicaoId && personagemEmEdicaoId === personagemAtualId) {
        mostrarPersonagem(personagemAtualId);
    }

    fecharModalPersonagem();
}

function editarPersonagemAtual() {
    if (personagemAtualId) abrirModalPersonagem(personagemAtualId);
}

async function excluirPersonagemAtual() {
    if (!personagemAtualId) return;
    const p = personagens.find(p => p.id === personagemAtualId);
    if (!confirm(`Excluir o personagem "${p.nome}" e todas as suas waifus?`)) return;

    personagens = personagens.filter(p => p.id !== personagemAtualId);
    personagemAtualId = null;

    await salvarDados();
    renderizarMenuPersonagens();
    document.getElementById("cardsContainer").innerHTML = "";
    document.getElementById("infoPersonagem").style.display = "none";
    document.getElementById("semPersonagem").style.display = "block";
    document.getElementById("btnAdicionarWaifu").style.display = "none";
}

function renderizarMenuPersonagens() {
    const lista = document.getElementById("listaPersonagens");
    lista.innerHTML = "";

    personagens.forEach(p => {
        const li = document.createElement("li");
        li.className = "item-personagem" + (p.id === personagemAtualId ? " ativo" : "");
        li.onclick = () => mostrarPersonagem(p.id);

        const avatarHTML = p.avatar
            ? `<img src="${p.avatar}" alt="${p.nome}">`
            : `<div class="avatar-placeholder">👤</div>`;

        li.innerHTML = `${avatarHTML}<span>${p.nome}</span>`;
        lista.appendChild(li);
    });
}

function mostrarPersonagem(id) {
    personagemAtualId = id;
    const p = personagens.find(p => p.id === id);

    // Atualiza topo
    document.getElementById("infoPersonagem").style.display = "flex";
    document.getElementById("semPersonagem").style.display = "none";
    document.getElementById("btnAdicionarWaifu").style.display = "block";

    const avatarTopo = document.getElementById("avatarTopo");
    if (p.avatar) {
        avatarTopo.src = p.avatar;
        avatarTopo.style.display = "block";
    } else {
        avatarTopo.style.display = "none";
    }

    document.getElementById("nomeTopo").textContent = p.nome;
    document.getElementById("bioTopo").textContent = p.bio || "";

    // Renderiza cards das waifus
    const container = document.getElementById("cardsContainer");
    container.innerHTML = "";
    p.waifus.forEach(w => container.appendChild(criarCard(w.nome, w.img, w.traits, w.ficha || {})));

    // Atualiza destaque no menu
    renderizarMenuPersonagens();
}

// ==================== WAIFUS ====================
function abrirModalWaifu() {
    cardEmEdicao = null;
    document.getElementById("modalWaifuTitulo").textContent = "Nova Waifu";
    document.getElementById("btnConfirmarWaifu").textContent = "Adicionar";
    document.getElementById("inputNome").value = "";
    document.getElementById("inputImg").value = "";
    document.getElementById("inputTraits").value = "";
    document.getElementById("nomeImagem").textContent = "Nenhuma imagem escolhida";
    document.getElementById("modalWaifuOverlay").classList.add("open");
}

function abrirEdicao(card) {
    cardEmEdicao = card;
    document.getElementById("modalWaifuTitulo").textContent = "Editar Waifu";
    document.getElementById("btnConfirmarWaifu").textContent = "Salvar";
    document.getElementById("inputNome").value = card.querySelector(".card-nome").textContent;
    const imgAtual = card.querySelector("img") ? card.querySelector("img").src : "";
    document.getElementById("inputImg").value = imgAtual;
    document.getElementById("nomeImagem").textContent = imgAtual ? imgAtual.split("\\").pop().split("/").pop() : "Nenhuma imagem escolhida";
    document.getElementById("inputTraits").value = card.querySelector(".card-traits").textContent;
    document.getElementById("modalWaifuOverlay").classList.add("open");
}

function fecharModalWaifu() {
    document.getElementById("modalWaifuOverlay").classList.remove("open");
}

function fecharModalWaifuFora(event) {
    if (event.target === document.getElementById("modalWaifuOverlay")) fecharModalWaifu();
}

async function escolherImagem() {
    const caminho = await window.electronAPI.selecionarImagem();
    if (caminho) {
        document.getElementById("inputImg").value = caminho;
        document.getElementById("nomeImagem").textContent = caminho.split("\\").pop();
    }
}

function criarCard(nome, img, traits, ficha = {}) {
    const card = document.createElement("div");
    card.className = "card";

    const imgHTML = img
        ? `<img src="${img}" alt="${nome}" onclick="abrirFicha(this.closest('.card'))" title="Ver ficha">`
        : `<div style="width:140px;height:190px;background:#3a006688;border-radius:8px;margin:0 auto;border:1px solid #6a00cc;cursor:pointer;" 
            onclick="abrirFicha(this.closest('.card'))"></div>`;

    card.innerHTML = `
        ${imgHTML}
        <div class="card-nome">${nome}</div>
        <div class="card-traits">${traits}</div>
        <div class="card-botoes">
            <button class="btn-editar" onclick="abrirEdicao(this.closest('.card'))">✏ Editar</button>
            <button class="btn-excluir" onclick="excluirCard(this.closest('.card'))">✕</button>
        </div>
    `;

    // Guarda a ficha como dado no card
    card.dataset.ficha = JSON.stringify(ficha);

    return card;
}

async function salvarWaifu() {
    const nome   = document.getElementById("inputNome").value.trim();
    const img    = document.getElementById("inputImg").value.trim();
    const traits = document.getElementById("inputTraits").value.trim();

    if (!nome) { alert("Digite o nome da waifu!"); return; }

    const p = personagens.find(p => p.id === personagemAtualId);

    if (cardEmEdicao) {
        const imgEl = cardEmEdicao.querySelector("img");
        if (imgEl) imgEl.src = img;
        cardEmEdicao.querySelector(".card-nome").textContent = nome;
        cardEmEdicao.querySelector(".card-traits").textContent = traits;
    } else {
        document.getElementById("cardsContainer").appendChild(criarCard(nome, img, traits));
    }

    // Sincroniza waifus do personagem com os cards na tela
    const cards = document.querySelectorAll(".card");
    p.waifus = Array.from(cards).map(card => ({
        nome:   card.querySelector(".card-nome").textContent,
        img:    card.querySelector("img") ? card.querySelector("img").src : "",
        traits: card.querySelector(".card-traits").textContent,
        ficha:  JSON.parse(card.dataset.ficha || "{}")
    }));

    await salvarDados();
    fecharModalWaifu();
}

async function excluirCard(card) {
    if (!confirm("Remover essa waifu?")) return;

    card.style.transition = "opacity 0.3s, transform 0.3s";
    card.style.opacity = 0;
    card.style.transform = "scale(0.9)";

    setTimeout(async () => {
        card.remove();
        const p = personagens.find(p => p.id === personagemAtualId);
        const cards = document.querySelectorAll(".card");
        p.waifus = Array.from(cards).map(card => ({
            nome:   card.querySelector(".card-nome").textContent,
            img:    card.querySelector("img") ? card.querySelector("img").src : "",
            traits: card.querySelector(".card-traits").textContent,
            ficha:  JSON.parse(card.dataset.ficha || "{}")
        }));
        await salvarDados();
    }, 300);
}

// ==================== DADOS ====================
async function salvarDados() {
    await window.electronAPI.salvarWaifus(personagens);
}

async function iniciar() {
    const dados = await window.electronAPI.lerWaifus();
    personagens = dados || [];
    renderizarMenuPersonagens();
}

// ==================== FICHA ====================
let cardFichaAtual = null;

function abrirFicha(card) {
    cardFichaAtual = card;
    const nome  = card.querySelector(".card-nome").textContent;
    const img   = card.querySelector("img") ? card.querySelector("img").src : "";
    const ficha = JSON.parse(card.dataset.ficha || "{}");

    // Preenche o header
    document.getElementById("fichaNome").textContent = nome;
    const fichaImg = document.getElementById("fichaImg");
    if (img) { fichaImg.src = img; fichaImg.style.display = "block"; }
    else { fichaImg.style.display = "none"; }

    // Preenche os campos
    document.getElementById("fichaNivel").value        = ficha.nivel        || 1;
    document.getElementById("fichaClasse").value       = ficha.classe       || "";
    document.getElementById("fichaRaca").value         = ficha.raca         || "";
    document.getElementById("fichaOrigem").value       = ficha.origem       || "";
    document.getElementById("fichaForca").value        = ficha.forca        || 10;
    document.getElementById("fichaAgilidade").value    = ficha.agilidade    || 10;
    document.getElementById("fichaInteligencia").value = ficha.inteligencia || 10;
    document.getElementById("fichaCarisma").value      = ficha.carisma      || 10;
    document.getElementById("fichaDescricao").value    = ficha.descricao    || "";

    // Preenche habilidades
    const lista = document.getElementById("listaHabilidades");
    lista.innerHTML = "";
    (ficha.habilidades || []).forEach(h => adicionarHabilidade(h));

    document.getElementById("modalFichaOverlay").classList.add("open");
}

function fecharFicha() {
    document.getElementById("modalFichaOverlay").classList.remove("open");
    cardFichaAtual = null;
}

function fecharFichaFora(event) {
    if (event.target === document.getElementById("modalFichaOverlay")) fecharFicha();
}

function adicionarHabilidade(texto = "") {
    const lista = document.getElementById("listaHabilidades");
    const div = document.createElement("div");
    div.className = "habilidade-item";
    div.innerHTML = `
        <input type="text" placeholder="Ex: Golpe Duplo — causa 2x de dano" value="${texto}">
        <button class="btn-remover-hab" onclick="this.parentElement.remove()">✕</button>
    `;
    lista.appendChild(div);
}

async function salvarFicha() {
    if (!cardFichaAtual) return;

    const habilidades = Array.from(
        document.querySelectorAll(".habilidade-item input")
    ).map(i => i.value.trim()).filter(Boolean);

    const ficha = {
        nivel:        parseInt(document.getElementById("fichaNivel").value)        || 1,
        classe:       document.getElementById("fichaClasse").value.trim(),
        raca:         document.getElementById("fichaRaca").value.trim(),
        origem:       document.getElementById("fichaOrigem").value.trim(),
        forca:        parseInt(document.getElementById("fichaForca").value)        || 10,
        agilidade:    parseInt(document.getElementById("fichaAgilidade").value)    || 10,
        inteligencia: parseInt(document.getElementById("fichaInteligencia").value) || 10,
        carisma:      parseInt(document.getElementById("fichaCarisma").value)      || 10,
        descricao:    document.getElementById("fichaDescricao").value.trim(),
        habilidades
    };

    // Atualiza o nome no card se foi editado
    const nomeEditado = document.getElementById("fichaNome").textContent.trim();
    if (nomeEditado) cardFichaAtual.querySelector(".card-nome").textContent = nomeEditado;

    // Salva a ficha no dataset do card
    cardFichaAtual.dataset.ficha = JSON.stringify(ficha);

    // Sincroniza com o personagem e salva no JSON
    const p = personagens.find(p => p.id === personagemAtualId);
    const cards = document.querySelectorAll(".card");
    p.waifus = Array.from(cards).map(card => ({
        nome:   card.querySelector(".card-nome").textContent,
        img:    card.querySelector("img") ? card.querySelector("img").src : "",
        traits: card.querySelector(".card-traits").textContent,
        ficha:  JSON.parse(card.dataset.ficha || "{}")
    }));

    await salvarDados();
    fecharFicha();
    alert("Ficha salva! ✦");
}

iniciar();