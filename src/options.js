document.getElementById('save').addEventListener('click', (event) => save());
updateCurrent();
function save(){
    const t = document.getElementById('tags').value.split(';').map(x=> x.trim().toUpperCase()).filter(x=> x.length > 0);
    browser.storage.local.set({'tags': t }).then(x => updateCurrent()).catch(er => console.error(er));
    
}
function updateCurrent(){
    browser.storage.local.get({'tags': []}).then(t => document.getElementById('current').innerText = t.tags.join(';')).catch(er => console.error(er));

}
