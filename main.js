/* eslint-disable indent */
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const svgo = require('svgo');
const settings = require('electron-settings');
const execFile = require('child_process').execFile;
const mozjpeg = require('mozjpeg');
const pngquant = require('pngquant-bin');
const makeDir = require('make-dir');
// const console = require('console'); // only for dev

let svg = new svgo();

// let userSettings = {};

let debug = 0;
let mainWindow;

function createWindow() {

    // Create the browser window.
    mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden-inset',
        width: 340,
        height: 550,
        frame: true,
        backgroundColor: '#F7F7F7',
        resizable: true,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png')
    });

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    if (debug === 1) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    let defaultSettings = {
        notification: true,
        folderswitch: true,
        clearlist: false
    };

    // set default settings at first launch
    if (Object.keys(settings.getAll()).length === 0) {
        settings.setAll(defaultSettings);
    }

    require('./menu/mainmenu');
}


app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Main logic
ipcMain.on(
    'shrinkImage', (event, fileName, filePath) => {

        fs.readFile(filePath, 'utf8', (err, data) => {

            if (err) {
                throw err;
            }

            let newFile = generateNewPath(filePath);

            switch (path.extname(fileName)) {

                case '.svg':
                    svg.optimize(data)
                        .then(function (result) {
                            fs.writeFile(newFile, result.data, (err) => {
                                if (!err) event.sender.send('isShrinked', newFile);
                                else dialog.showMessageBox({
                                    'type': 'error',
                                    'message': 'I\'m not able to write your new image. Sorry!'
                                });
                            });
                        })
                        .catch(function (error) {
                            dialog(error.message);
                        });

                    break;

                case '.jpg':
                case '.jpeg':
                    execFile(mozjpeg, ['-outfile', newFile, filePath], (err) => {
                        if (!err) event.sender.send('isShrinked', newFile);
                        else dialog.showMessageBox({
                            'type': 'error',
                            'message': 'I\'m not able to write your new image. Sorry!'
                        });
                    });

                    break;

                case '.png':
                    execFile(pngquant, ['-fo', newFile, filePath], (err) => {
                        if (!err) event.sender.send('isShrinked', newFile);
                        else dialog.showMessageBox({
                            'type': 'error',
                            'message': 'I\'m not able to write your new image. Sorry!'
                        });
                    });

                    break;

                default:
                    dialog.showMessageBox({
                        'type': 'error',
                        'message': 'Only SVG, JPG and PNG allowed'
                    });
            }
        });
    }
);


const generateNewPath = (pathName) => {

    let objPath = path.parse(pathName);

    if (settings.get('folderswitch') === false && typeof settings.get('savepath') !== 'undefined') {
        objPath.dir = settings.get('savepath')[0];
    }

    makeDir.sync(objPath.dir);
    objPath.base = objPath.name + '.min' + objPath.ext;

    return path.format(objPath);
};


module.exports = debug;