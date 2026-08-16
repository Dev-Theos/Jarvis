import {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  shell,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Orchestrator } from '../core/orchestrator/Orchestrator.js';
import type { JarvisSettings, PermissionDecision } from '../core/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let orchestrator: Orchestrator | null = null;

function userDataPaths() {
  const userDataDir = path.join(app.getPath('userData'), 'jarvis');
  return {
    userDataDir,
    workspaceRoot: path.join(userDataDir, 'workspace'),
    dbPath: path.join(userDataDir, 'memory.db'),
    settingsPath: path.join(userDataDir, 'settings.json'),
    secretsPath: path.join(userDataDir, 'secrets.bin'),
  };
}

function loadEncryptedSecrets(secretsPath: string): Partial<JarvisSettings> {
  try {
    if (!fs.existsSync(secretsPath)) return {};
    if (safeStorage.isEncryptionAvailable()) {
      const buf = fs.readFileSync(secretsPath);
      const json = safeStorage.decryptString(buf);
      return JSON.parse(json) as Partial<JarvisSettings>;
    }
    // Dev/CI fallback: secrets stored as JSON next to settings
    return JSON.parse(fs.readFileSync(secretsPath, 'utf8')) as Partial<JarvisSettings>;
  } catch {
    return {};
  }
}

function saveEncryptedSecrets(secretsPath: string, settings: JarvisSettings) {
  const payload = {
    llmApiKey: settings.llmApiKey,
    anthropicApiKey: settings.anthropicApiKey,
    fishApiKey: settings.fishApiKey,
  };
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(secretsPath, safeStorage.encryptString(JSON.stringify(payload)));
  } else {
    fs.writeFileSync(secretsPath, JSON.stringify(payload, null, 2), 'utf8');
  }
}

function createOrchestrator() {
  const paths = userDataPaths();
  fs.mkdirSync(paths.userDataDir, { recursive: true });
  const secrets = loadEncryptedSecrets(paths.secretsPath);
  orchestrator = new Orchestrator(paths, secrets);
  orchestrator.on((event) => {
    mainWindow?.webContents.send('jarvis:event', event);
  });
  return orchestrator;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#070b12',
    title: 'JARVIS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('jarvis:getBootstrap', () => {
    const o = orchestrator!;
    return {
      settings: o.getPublicSettings(),
      history: o.getHistory(),
      task: o.getTask(),
      audit: o.listAudit(50),
      memories: o.memory.list(50),
    };
  });

  ipcMain.handle('jarvis:sendMessage', async (_e, text: string, fromVoice?: boolean) => {
    return orchestrator!.handleUserText(String(text ?? ''), { fromVoice: Boolean(fromVoice) });
  });

  ipcMain.handle('jarvis:stop', () => orchestrator!.stop());

  ipcMain.handle(
    'jarvis:resolvePermission',
    (_e, id: string, decision: PermissionDecision) =>
      orchestrator!.resolvePermission(id, decision),
  );

  ipcMain.handle('jarvis:updateSettings', (_e, patch: Partial<JarvisSettings>) => {
    const o = orchestrator!;
    const updated = o.updateSettings(patch ?? {});
    saveEncryptedSecrets(userDataPaths().secretsPath, o.getSettings());
    return updated;
  });

  ipcMain.handle('jarvis:listMemories', (_e, query?: string) => {
    if (query) return orchestrator!.memory.search(String(query), 50);
    return orchestrator!.memory.list(100);
  });

  ipcMain.handle('jarvis:deleteMemory', async (_e, id: string) => {
    return orchestrator!.deleteMemory(String(id));
  });

  ipcMain.handle('jarvis:getAudit', () => orchestrator!.listAudit(200));

  ipcMain.handle('jarvis:speak', async (_e, text: string) => {
    const audio = await orchestrator!.synthesizeSpeech(String(text ?? ''));
    if (!audio || audio.length === 0) return null;
    return audio.toString('base64');
  });

  ipcMain.handle('jarvis:openPath', async (_e, target: string) => {
    const paths = userDataPaths();
    const resolved = path.resolve(paths.workspaceRoot, String(target ?? ''));
    if (!resolved.startsWith(paths.workspaceRoot)) return false;
    await shell.openPath(resolved);
    return true;
  });
}

app.whenReady().then(() => {
  createOrchestrator();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  orchestrator?.dispose();
  if (process.platform !== 'darwin') app.quit();
});
