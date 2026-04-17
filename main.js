const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Usar a pasta de dados do usuário (AppData) que tem permissão de escrita
const jsonPath = path.join(app.getPath('userData'), "waifus.json");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            nodeIntegration: false,
            webSecurity: true
        }
    });

    win.loadFile("html/index.html");
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== "darwin") app.quit();
});

// ========== IMAGEM ===========
ipcMain.handle("selecionar-imagem", async () => {
    const resultado = await dialog.showOpenDialog({
        title: "Escolha a imagem da waifu",
        filters: [{ name: "Imagem", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
    });

    if (resultado.canceled) return null;
    return resultado.filePaths[0];
});

// ========== LER / SALVAR ===========
ipcMain.handle("ler-waifus", () => {
    if (!fs.existsSync(jsonPath)) return [];
    const conteudo = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(conteudo);
});

ipcMain.handle("salvar-waifus", (event, lista) => {
    fs.writeFileSync(jsonPath, JSON.stringify(lista, null, 2), "utf-8");
    return true;
});

// ========== EXPORTAR BACKUP ===========
// Recebe a lista já processada (com imagens em base64 vindas do renderer)
// e abre um diálogo para o usuário escolher onde salvar o arquivo .waifu
ipcMain.handle("exportar-backup", async (event, dadosJson) => {
    const resultado = await dialog.showSaveDialog({
        title: "Exportar backup",
        defaultPath: `waifus-backup-${new Date().toISOString().slice(0,10)}.waifu`,
        filters: [{ name: "Backup Waifus RPG", extensions: ["waifu"] }]
    });

    if (resultado.canceled || !resultado.filePath) return { ok: false };

    fs.writeFileSync(resultado.filePath, dadosJson, "utf-8");
    return { ok: true };
});

// ========== IMPORTAR BACKUP ===========
ipcMain.handle("importar-backup", async () => {
    const resultado = await dialog.showOpenDialog({
        title: "Importar backup",
        filters: [{ name: "Backup Waifus RPG", extensions: ["waifu"] }],
        properties: ["openFile"]
    });

    if (resultado.canceled || resultado.filePaths.length === 0) return null;

    const conteudo = fs.readFileSync(resultado.filePaths[0], "utf-8");
    return conteudo; // JSON string — será processado no renderer
});