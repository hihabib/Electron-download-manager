const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const pause = document.querySelector('#pause');
    const link = document.querySelector('#link');
    const resume = document.querySelector('#resume');
    const addDownload = document.querySelector('#addDownload');
    const cancel = document.querySelector('#cancel');
    const determinate = document.querySelector('.determinate');
    const close = document.querySelector('.close');



    addDownload.addEventListener('click', () => {
        window.browserProxy = window.open('popup.html', '_blank', `height=200,width=250,frame=false`)
    })

    window.addEventListener('message', (e) => {
        if (e.data === 'cancel') {
            window.browserProxy.close();
        }else if(e.data === 'contextmenu') {
            ipcRenderer.invoke('contextmenu');
        }
        else {
            link.setAttribute('href', e.data)
            window.browserProxy.close();
        }
    })
    ipcRenderer.on('paste', (event, data) => {
        window.browserProxy.postMessage(data, '*');
    })

    pause.style.display = 'none';
    resume.style.display = 'none'
    cancel.style.display = 'none'

    const { port1, port2 } = new MessageChannel();

    link.addEventListener('click', () => {
        ipcRenderer.postMessage('download-started', null, [port2]);
        pause.style.display = 'inline-block';
        cancel.style.display = 'inline-block'

    })

    pause.addEventListener('click', () => {
        port1.postMessage('pause');
        pause.style.display = 'none'
        resume.style.display = 'inline-block'
    })

    resume.addEventListener('click', () => {
        port1.postMessage('resume');
        resume.style.display = 'none'
        pause.style.display = 'inline-block'
    })
    cancel.addEventListener('click', () => {
        port1.postMessage('cancel');
        resume.style.display = 'none';
        pause.style.display = 'none';
        cancel.style.display = 'none';
        determinate.setAttribute('style', 'width: 0%');
        document.querySelector('.size').innerText = ''
    })
    close.addEventListener('click', () => {
        ipcRenderer.invoke('close')
    })


})