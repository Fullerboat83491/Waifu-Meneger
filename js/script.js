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
        li.dataset.id = p.id;
        li.onclick = () => mostrarPersonagem(p.id);

        const avatarHTML = p.avatar
            ? `<img src="${p.avatar}" alt="${p.nome}">`
            : `<div class="avatar-placeholder">👤</div>`;

        li.innerHTML = `${avatarHTML}<span>${p.nome}</span>`;
        lista.appendChild(li);
    });

    // Ativa drag-and-drop no menu de personagens
    ativarDragPersonagens();
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

    // Ativa drag-and-drop nos cards
    ativarDragCards();

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
        // Preserva a ficha salva no card antes de reconstruir o conteúdo
        const fichaAtual = cardEmEdicao.dataset.ficha || "{}";

        const imgHTML = img
            ? `<img src="${img}" alt="${nome}" onclick="abrirFicha(this.closest('.card'))" title="Ver ficha">`
            : `<div style="width:140px;height:190px;background:#3a006688;border-radius:8px;margin:0 auto;border:1px solid #6a00cc;cursor:pointer;"
                onclick="abrirFicha(this.closest('.card'))"></div>`;

        cardEmEdicao.innerHTML = `
            ${imgHTML}
            <div class="card-nome">${nome}</div>
            <div class="card-traits">${traits}</div>
            <div class="card-botoes">
                <button class="btn-editar" onclick="abrirEdicao(this.closest('.card'))">✏ Editar</button>
                <button class="btn-excluir" onclick="excluirCard(this.closest('.card'))">✕</button>
            </div>
        `;

        cardEmEdicao.dataset.ficha = fichaAtual;
        ativarDragCards();
    } else {
        const novoCard = criarCard(nome, img, traits);
        document.getElementById("cardsContainer").appendChild(novoCard);
        ativarDragCards();
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

// ==================== DRAG AND DROP - CARDS ====================
function ativarDragCards() {
    const container = document.getElementById("cardsContainer");
    const cards = container.querySelectorAll(".card");

    cards.forEach(card => {
        // Remove listeners antigos para evitar duplicatas
        card.removeEventListener("mousedown", card._dragHandler);
        card._dragHandler = (e) => iniciarDragCard(e, card);
        card.addEventListener("mousedown", card._dragHandler);
    });
}

function iniciarDragCard(e, card) {
    // Ignora cliques em botões, inputs e na imagem (que abre ficha)
    if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT" || e.target.tagName === "IMG") return;

    e.preventDefault();

    const container = document.getElementById("cardsContainer");
    const rect = card.getBoundingClientRect();

    // Cria um clone visual para arrastar
    const clone = card.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.width = rect.width + "px";
    clone.style.height = rect.height + "px";
    clone.style.top = rect.top + "px";
    clone.style.left = rect.left + "px";
    clone.style.opacity = "0.85";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.style.transform = "scale(1.05) rotate(2deg)";
    clone.style.boxShadow = "0 16px 40px #c97aff66";
    clone.style.transition = "box-shadow 0.2s";
    document.body.appendChild(clone);

    // Espaço reservado no lugar original
    const placeholder = document.createElement("div");
    placeholder.className = "card drag-placeholder";
    placeholder.style.width = rect.width + "px";
    placeholder.style.height = rect.height + "px";
    placeholder.style.opacity = "0.3";
    placeholder.style.border = "2px dashed #c97aff";
    placeholder.style.borderRadius = "12px";
    placeholder.style.background = "#6a00cc22";
    placeholder.style.pointerEvents = "none";

    card.style.opacity = "0";
    container.insertBefore(placeholder, card);

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    let dragTarget = card;

    function onMouseMove(ev) {
        clone.style.left = (ev.clientX - offsetX) + "px";
        clone.style.top  = (ev.clientY - offsetY) + "px";

        // Encontra o card sob o cursor para reposicionar o placeholder
        clone.style.display = "none";
        const elementoAbaixo = document.elementFromPoint(ev.clientX, ev.clientY);
        clone.style.display = "";

        const cardAbaixo = elementoAbaixo ? elementoAbaixo.closest(".card") : null;

        if (cardAbaixo && cardAbaixo !== card && cardAbaixo !== placeholder) {
            const rectAbaixo = cardAbaixo.getBoundingClientRect();
            const meio = rectAbaixo.left + rectAbaixo.width / 2;

            if (ev.clientX < meio) {
                container.insertBefore(placeholder, cardAbaixo);
            } else {
                container.insertBefore(placeholder, cardAbaixo.nextSibling);
            }
        }
    }

    async function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        // Insere o card real no lugar do placeholder
        container.insertBefore(card, placeholder);
        placeholder.remove();
        clone.remove();
        card.style.opacity = "";

        // Reativa drag nos cards
        ativarDragCards();

        // Salva nova ordem
        const p = personagens.find(p => p.id === personagemAtualId);
        if (p) {
            const cards = container.querySelectorAll(".card");
            p.waifus = Array.from(cards).map(c => ({
                nome:   c.querySelector(".card-nome").textContent,
                img:    c.querySelector("img") ? c.querySelector("img").src : "",
                traits: c.querySelector(".card-traits").textContent,
                ficha:  JSON.parse(c.dataset.ficha || "{}")
            }));
            await salvarDados();
        }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

// ==================== DRAG AND DROP - PERSONAGENS ====================
function ativarDragPersonagens() {
    const lista = document.getElementById("listaPersonagens");
    const itens = lista.querySelectorAll(".item-personagem");

    itens.forEach(item => {
        item.removeEventListener("mousedown", item._dragHandler);
        item._dragHandler = (e) => iniciarDragPersonagem(e, item);
        item.addEventListener("mousedown", item._dragHandler);
    });
}

function iniciarDragPersonagem(e, item) {
    // Só inicia o drag se segurar pelo menos 150ms (evita conflito com clique)
    let dragIniciado = false;
    let timeoutDrag;
    const lista = document.getElementById("listaPersonagens");

    const rect = item.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    function verificarMovimento(ev) {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if ((dx > 5 || dy > 5) && !dragIniciado) {
            dragIniciado = true;
            clearTimeout(timeoutDrag);
            executarDragPersonagem(ev, item);
            document.removeEventListener("mousemove", verificarMovimento);
            document.removeEventListener("mouseup", cancelarEspera);
        }
    }

    function cancelarEspera() {
        clearTimeout(timeoutDrag);
        document.removeEventListener("mousemove", verificarMovimento);
        document.removeEventListener("mouseup", cancelarEspera);
    }

    document.addEventListener("mousemove", verificarMovimento);
    document.addEventListener("mouseup", cancelarEspera);
}

function executarDragPersonagem(e, item) {
    e.preventDefault();

    const lista = document.getElementById("listaPersonagens");
    const rect = item.getBoundingClientRect();

    // Clone visual
    const clone = item.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.width = rect.width + "px";
    clone.style.top = rect.top + "px";
    clone.style.left = rect.left + "px";
    clone.style.opacity = "0.85";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.style.transform = "scale(1.04)";
    clone.style.boxShadow = "0 8px 32px #c97aff55";
    clone.style.borderRadius = "10px";
    document.body.appendChild(clone);

    // Placeholder
    const placeholder = document.createElement("li");
    placeholder.style.height = rect.height + "px";
    placeholder.style.border = "2px dashed #c97aff";
    placeholder.style.borderRadius = "10px";
    placeholder.style.background = "#6a00cc22";
    placeholder.style.opacity = "0.5";
    placeholder.style.listStyle = "none";
    placeholder.style.pointerEvents = "none";

    item.style.opacity = "0";
    lista.insertBefore(placeholder, item);

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    function onMouseMove(ev) {
        clone.style.left = (ev.clientX - offsetX) + "px";
        clone.style.top  = (ev.clientY - offsetY) + "px";

        clone.style.display = "none";
        const elementoAbaixo = document.elementFromPoint(ev.clientX, ev.clientY);
        clone.style.display = "";

        const itemAbaixo = elementoAbaixo ? elementoAbaixo.closest(".item-personagem") : null;

        if (itemAbaixo && itemAbaixo !== item && itemAbaixo !== placeholder) {
            const rectAbaixo = itemAbaixo.getBoundingClientRect();
            const meio = rectAbaixo.top + rectAbaixo.height / 2;

            if (ev.clientY < meio) {
                lista.insertBefore(placeholder, itemAbaixo);
            } else {
                lista.insertBefore(placeholder, itemAbaixo.nextSibling);
            }
        }
    }

    async function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        lista.insertBefore(item, placeholder);
        placeholder.remove();
        clone.remove();
        item.style.opacity = "";

        // Reordena o array `personagens` conforme a nova ordem visual
        const novosIds = Array.from(lista.querySelectorAll(".item-personagem")).map(li => li.dataset.id);
        personagens.sort((a, b) => novosIds.indexOf(a.id) - novosIds.indexOf(b.id));

        // Reativa drag
        ativarDragPersonagens();

        await salvarDados();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

// ==================== BACKUP ====================

// Lê um arquivo de imagem via fetch e converte para base64 data URL
async function imagemParaBase64(src) {
    if (!src) return "";
    // Se já for base64, retorna direto
    if (src.startsWith("data:")) return src;

    try {
        // Electron serve arquivos locais via file:// — usa fetch para ler
        const url = src.startsWith("file://") ? src : "file:///" + src.replace(/\\/g, "/");
        const resp = await fetch(url);
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

async function exportarBackup() {
    const btnExportar = document.getElementById("btnExportar");
    btnExportar.textContent = "⏳ Exportando...";
    btnExportar.disabled = true;

    try {
        // Cria uma cópia profunda dos dados e converte todas as imagens para base64
        const dadosParaExportar = await Promise.all(personagens.map(async (p) => {
            const avatarB64 = await imagemParaBase64(p.avatar);

            const waifusB64 = await Promise.all(p.waifus.map(async (w) => ({
                ...w,
                img: await imagemParaBase64(w.img)
            })));

            return { ...p, avatar: avatarB64, waifus: waifusB64 };
        }));

        const json = JSON.stringify(dadosParaExportar, null, 2);
        const resultado = await window.electronAPI.exportarBackup(json);

        if (resultado.ok) {
            alert("✦ Backup exportado com sucesso!");
        }
    } catch (err) {
        alert("Erro ao exportar backup: " + err.message);
    } finally {
        btnExportar.textContent = "📤 Exportar";
        btnExportar.disabled = false;
    }
}

async function importarBackup() {
    const btnImportar = document.getElementById("btnImportar");
    const jsonStr = await window.electronAPI.importarBackup();
    if (!jsonStr) return;

    try {
        const dadosImportados = JSON.parse(jsonStr);

        if (!Array.isArray(dadosImportados)) throw new Error("Formato inválido.");

        const opcao = confirm(
            `O backup contém ${dadosImportados.length} personagem(ns).\n\n` +
            `Clique OK para SUBSTITUIR todos os dados atuais.\n` +
            `Clique Cancelar para MESCLAR (adiciona sem apagar os existentes).`
        );

        if (opcao) {
            // Substitui tudo
            personagens = dadosImportados;
        } else {
            // Mescla: adiciona apenas personagens cujo id não existe ainda
            const idsExistentes = new Set(personagens.map(p => p.id));
            const novos = dadosImportados.filter(p => !idsExistentes.has(p.id));
            // Para personagens com id duplicado, gera novo id para não colidir
            const duplicados = dadosImportados
                .filter(p => idsExistentes.has(p.id))
                .map(p => ({ ...p, id: Date.now().toString() + Math.random().toString(36).slice(2) }));
            personagens = [...personagens, ...novos, ...duplicados];
        }

        await salvarDados();
        personagemAtualId = null;
        renderizarMenuPersonagens();

        document.getElementById("cardsContainer").innerHTML = "";
        document.getElementById("infoPersonagem").style.display = "none";
        document.getElementById("semPersonagem").style.display = "block";
        document.getElementById("btnAdicionarWaifu").style.display = "none";

        alert(`✦ Backup importado! ${dadosImportados.length} personagem(ns) carregado(s).`);
    } catch (err) {
        alert("Erro ao importar backup: " + err.message);
    }
}

iniciar();