const { app, BrowserWindow, ipcMain, Menu, session, clipboard } = require('electron');
const path = require('path');
const fs = require('fs')


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src', 'preload.js'),
    },
    icon: path.join(__dirname, 'download-flat.png'),
    title: "Simple Download Manager"
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  // createPopup();
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setIgnoreMenuShortcuts(true);
  mainWindow.webContents.on('did-create-window', (brWindow) => {
    const frame = brWindow.webContents.mainFrame;
    frame.on('dom-ready', () => {
      fs.readFile(path.join(app.getAppPath(), 'src', 'popup.js'), 'utf8', (error, data) => {
        if(!error) {
          frame.executeJavaScript(data)
        } else {
          console.log(error);
        }
      })
    })
  });

  mainWindow.webContents.on('did-create-window', (popupWindow) => {
    popupWindow.webContents.setIgnoreMenuShortcuts(true);
  })

  mainWindow.webContents.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        parent: mainWindow,
        modal: true,
        resizable: false
      }
    }
  })
  ipcMain.on('download-started', (portEvent) => {
  session.defaultSession.on('will-download', (event, downloadItem, webContent) => {

      const port2 = portEvent.ports[0];

      downloadItem.setSavePath(app.getPath('desktop') + '/' + downloadItem.getFilename());

      downloadItem.on('updated', (e, state) => {
        const totalSize = Number(downloadItem.getTotalBytes() * (1 / 10 ** 6)).toFixed(2)
        const receivedData = Number(downloadItem.getReceivedBytes() * (1 / 10 ** 6)).toFixed(2)
        
        const progess = Math.round((downloadItem.getReceivedBytes() / downloadItem.getTotalBytes()) * 100);
        webContent.executeJavaScript(`
          document.querySelector('.determinate').setAttribute('style', 'width: ${progess}%');
          document.querySelector('.size').innerText = ${receivedData} + 'MB of ' + ${totalSize} + 'MB'
        `);
      })

      port2.on('message', (actionEvent) => {
          switch(actionEvent.data) {
            case 'pause':
              downloadItem.pause();
              break;
            case 'resume':
              downloadItem.resume();
              break;
            case 'cancel':
              downloadItem.cancel();
              break;
          }
      })
      port2.start();
    })
  })
});
ipcMain.handle('close', () => {
  app.quit();
})

ipcMain.handle('contextmenu', (event) => {
  const webContents = event.sender;
  const template = [
    {
      label: 'Paste',
      click: () => {
        webContents.send('paste', clipboard.readText())
      }
    }
  ]

  const contextmenu = Menu.buildFromTemplate(template);
  contextmenu.popup(BrowserWindow.fromWebContents(webContents))
})