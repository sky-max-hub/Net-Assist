import { app, BrowserWindow, Menu, shell, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/ipc-router'
import { ConnectionManager } from './connections/connection-manager'

let connectionManager: ConnectionManager

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources/icon.ico')
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'NetAssist',
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  connectionManager = new ConnectionManager(() => BrowserWindow.getAllWindows()[0] ?? null)
  registerIpcHandlers(connectionManager)
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('before-quit', () => {
    // Tab 数据在 renderer 端每次 createTab/closeTab/setTabConfig/updateTabTitle 时已实时保存。
    // electron-store 写入为同步操作，正常退出时数据已在磁盘 — 此处为保底占位。
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  connectionManager?.destroyAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
