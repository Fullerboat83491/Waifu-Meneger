const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
    lerWaifus:       () => ipcRenderer.invoke("ler-waifus"),
    salvarWaifus:    (lista) => ipcRenderer.invoke("salvar-waifus", lista),
    selecionarImagem: () => ipcRenderer.invoke("selecionar-imagem"),
    exportarBackup:  (dadosJson) => ipcRenderer.invoke("exportar-backup", dadosJson),
    importarBackup:  () => ipcRenderer.invoke("importar-backup")
});