/* The only bridge between the pages and the app. Deliberately narrow:
   listen to the overlay feed, read and write the settings, nothing else. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlay", {
  onTick:     (fn) => ipcRenderer.on("tick",     (_e, p) => fn(p)),
  onStatus:   (fn) => ipcRenderer.on("status",   (_e, p) => fn(p)),
  onSettings: (fn) => ipcRenderer.on("settings", (_e, p) => fn(p)),
  getSettings: ()  => ipcRenderer.invoke("settings:get"),
  setSettings: (s) => ipcRenderer.invoke("settings:set", s),
  listBuilds: (champ) => ipcRenderer.invoke("builds:list", champ),
  authStatus: () => ipcRenderer.invoke("auth:status"),
  signIn:     () => ipcRenderer.invoke("auth:in"),
  signOut:    () => ipcRenderer.invoke("auth:out"),
  onUpdate:    (fn) => ipcRenderer.on("update", (_e, p) => fn(p)),
  updateState: () => ipcRenderer.invoke("update:state"),
  openUpdate:  () => ipcRenderer.invoke("update:open"),
  onHub:        (fn) => ipcRenderer.on("hub", (_e, p) => fn(p)),
  hubInfo:      () => ipcRenderer.invoke("hub:info"),
  openSettings: () => ipcRenderer.invoke("hub:settings"),
  hideHub:      () => ipcRenderer.invoke("hub:hide"),
  importBuild:  (id) => ipcRenderer.invoke("build:import", id)
});
