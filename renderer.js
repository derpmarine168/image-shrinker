
'use strict';

const {ipcRenderer,shell} = require('electron')


var dragzone = document.getElementById('dragzone'),
    resultBox = document.getElementById('result');

dragzone.ondragover = () => {
    dragzone.classList.add('drag-active')
    return false
}

dragzone.ondragleave = () => {
    dragzone.classList.remove('drag-active')
    return false
}

dragzone.ondragend = () => {
    dragzone.classList.remove('drag-active')
    return false;
};

dragzone.ondrop = (e) => {
    e.preventDefault();

    for (let f of e.dataTransfer.files) {
        ipcRenderer.send('shrinkSvg', f.name, f.path, f.lastModified);
    }
    dragzone.classList.remove('drag-active')

    return false;
};

ipcRenderer.on('isShrinked', (event, path) => {
    const result = `<span>Wrote SVG to:</span><br>${path}`
    resultBox.innerHTML += `<div class="resLine" data-finder="${result}">${result}</div>`;
})