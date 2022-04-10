
const button = document.querySelector('#download');
const cancel = document.querySelector('#cancel');
const downloadLink = document.querySelector('#downloadLink');
const forTag = document.querySelector('[for="downloadLink"]');

cancel.addEventListener('click', () => {
    window.opener.postMessage('cancel', '*');
})
button.addEventListener('click', () => {
    const link = document.querySelector('input').value;
    window.opener.postMessage(link, '*');
})

document.addEventListener('contextmenu', () => {
    window.opener.postMessage('contextmenu', '*');
})

window.addEventListener('message', (e) => {
    forTag.classList.add('active');
    downloadLink.value = e.data
})