const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const jsonPath = path.join(__dirname, "data", "waifus.json");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            nodeIntegration: false,
            webSecurity: true // Desativa a política de segurança de conteúdo
        }
    })

    win.loadFile("html/index.html");
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("selecionar-imagem", async () => {
    const resultado = await dialog.showOpenDialog({
        title: "Escolha a imagem da waifu",
        filters: [{ name: "Imagem", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
    })

    if (resultado.canceled) return null;
    return resultado.filePaths[0]; // retorna o caminho do arquivo
})

ipcMain.handle("ler-waifus", () => {
    if (!fs.existsSync(jsonPath)) return []; // Se o arquivo não existir, retorna um array vazio
    const conteudo = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(conteudo);
});

// Lê o Json e retorna para o renderer
ipcMain.handle("salvar-waifus", (event, lista) => {
    fs.writeFileSync(jsonPath, JSON.stringify(lista, null, 2), "utf-8");
    return true;
});

