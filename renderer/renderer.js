// Renderer script: simple CRUD for three sections

const state = {
    path: null,
    data: {
        EnableDebug: 0,
        DeleteLogs: 0,
        MaxSpareMags: 2,
        RandomQuantity: 1,
        LootChestsLocations: [],
        LCPredefinedWeapons: [],
        LootCategories: []
    },
    currentTab: 'LootChestsLocations'
};

const schemas = {
    LootChestsLocations: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'number', label: 'Number', type: 'number' },
        { key: 'pos', label: 'Pos (comma-separated lines)', type: 'textarea' },
        { key: 'keyclass', label: 'Keyclass', type: 'text' },
        { key: 'openable', label: 'Openable', type: 'number' },
        { key: 'chest', label: 'Chest (comma-separated)', type: 'text' },
        { key: 'lootrandomize', label: 'Lootrandomize (0-1)', type: 'number' },
        { key: 'light', label: 'Light (0/1)', type: 'number' },
        { key: 'loot', label: 'Loot (comma-separated)', type: 'text' }
    ],
    LCPredefinedWeapons: [
        { key: 'defname', label: 'Defname', type: 'text' },
        { key: 'weapon', label: 'Weapon', type: 'text' },
        { key: 'magazine', label: 'Magazine', type: 'text' },
        { key: 'attachments', label: 'Attachments (comma-separated)', type: 'text' },
        { key: 'optic', label: 'Optic', type: 'text' },
        { key: 'opticbattery', label: 'Optic Battery (0/1)', type: 'number' }
    ],
    LootCategories: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'Loot', label: 'Loot (comma-separated)', type: 'text' }
    ]
};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function init() {
    $all('.tab').forEach(b => b.addEventListener('click', onTabClick));
    $('#btnOpen').addEventListener('click', openFile);
    $('#btnSave').addEventListener('click', saveFile);
    $('#btnSaveAs').addEventListener('click', saveAsFile);
    $('#btnLoadSample').addEventListener('click', loadSample);

    // default tab
    renderTab(state.currentTab);
}

function onTabClick(e) {
    const t = e.currentTarget.dataset.target;
    state.currentTab = t;
    renderTab(t);
}

function renderTab(name) {
    const content = $('#content');
    content.innerHTML = '';
    const tpl = document.getElementById('list-template');
    const clone = tpl.content.cloneNode(true);
    clone.querySelector('h2').textContent = name;
    clone.querySelector('.add').addEventListener('click', () => openEditor(null, name));
    const items = clone.querySelector('.items');

    const arr = state.data[name] || [];
    arr.forEach((it, idx) => {
        const node = document.createElement('div');
        node.className = 'item';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<strong>${(it.name || it.defname) || ('Item ' + (idx + 1))}</strong><div>${JSON.stringify(it)}</div>`;
        const actions = document.createElement('div');
        actions.className = 'actions';
        const btnEdit = document.createElement('button'); btnEdit.textContent = 'Edit';
        const btnDel = document.createElement('button'); btnDel.textContent = 'Delete';
        btnEdit.addEventListener('click', () => openEditor(idx, name));
        btnDel.addEventListener('click', () => { if (confirm('Delete this item?')) { arr.splice(idx, 1); renderTab(name); } });
        actions.appendChild(btnEdit); actions.appendChild(btnDel);
        node.appendChild(meta); node.appendChild(actions);
        items.appendChild(node);
    });

    content.appendChild(clone);
}

function openEditor(index, section) {
    const dialog = document.getElementById('editorDialog');
    const title = document.getElementById('dialogTitle');
    const fields = document.getElementById('formFields');
    fields.innerHTML = '';
    title.textContent = (index === null ? 'Add' : 'Edit') + ' — ' + section;
    const schema = schemas[section];
    const value = (state.data[section] && index !== null) ? state.data[section][index] : {};

    // helper to create array editor (reorderable list)
    function createArrayEditor(name, items, autocompleteList) {
        const container = document.createElement('div');
        container.className = 'array-editor';

        const list = document.createElement('div');
        list.className = 'array-list';

        function renderItems() {
            list.innerHTML = '';
            items.forEach((it, i) => {
                const row = document.createElement('div'); row.className = 'array-item';
                const text = document.createElement('div'); text.className = 'array-text'; text.textContent = it;
                const actions = document.createElement('div'); actions.className = 'array-actions';
                const up = document.createElement('button'); up.type = 'button'; up.textContent = '↑';
                const down = document.createElement('button'); down.type = 'button'; down.textContent = '↓';
                const del = document.createElement('button'); del.type = 'button'; del.textContent = '✕';
                up.title = 'Move up'; down.title = 'Move down'; del.title = 'Delete';
                up.addEventListener('click', () => { if (i > 0) { const t = items[i - 1]; items[i - 1] = items[i]; items[i] = t; renderItems(); } });
                down.addEventListener('click', () => { if (i < items.length - 1) { const t = items[i + 1]; items[i + 1] = items[i]; items[i] = t; renderItems(); } });
                del.addEventListener('click', () => { items.splice(i, 1); renderItems(); });
                actions.appendChild(up); actions.appendChild(down); actions.appendChild(del);
                row.appendChild(text); row.appendChild(actions);
                list.appendChild(row);
            });
        }

        const addWrap = document.createElement('div'); addWrap.className = 'array-add';
        const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'Add item...'; inp.className = 'array-input';
        if (autocompleteList && autocompleteList.length > 0) {
            const dlId = 'dl-' + name + '-' + Math.random().toString(36).slice(2, 8);
            const dl = document.createElement('datalist'); dl.id = dlId;
            autocompleteList.forEach(a => { const opt = document.createElement('option'); opt.value = a; dl.appendChild(opt); });
            addWrap.appendChild(dl);
            inp.setAttribute('list', dlId);
        }
        const addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.textContent = 'Add';
        function addFromInput() { const v = inp.value.trim(); if (v) { items.push(v); inp.value = ''; renderItems(); inp.focus(); } }
        addBtn.addEventListener('click', () => addFromInput());
        inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addFromInput(); } });
        addWrap.appendChild(inp); addWrap.appendChild(addBtn);

        container.appendChild(list); container.appendChild(addWrap);
        renderItems();
        return container;
    }

    schema.forEach(f => {
        const wrap = document.createElement('div'); wrap.className = 'field';
        const label = document.createElement('label'); label.textContent = f.label;
        wrap.appendChild(label);

        if (f.type === 'textarea') {
            const ta = document.createElement('textarea'); ta.rows = 4; ta.name = f.key;
            ta.value = (value[f.key] && Array.isArray(value[f.key])) ? value[f.key].join('\n') : (value[f.key] || '');
            wrap.appendChild(ta);
        } else if (f.type === 'text' && (f.key === 'chest' || f.key === 'loot' || f.key === 'attachments' || f.key === 'Loot')) {
            // use array editor for these fields
            const existing = (value[f.key] && Array.isArray(value[f.key])) ? value[f.key].slice() : [];
            // build autocomplete source depending on section and field
            let autocomplete = null;
            if (section === 'LootChestsLocations' && f.key === 'loot') {
                // suggest loot table names (names of LootCategories)
                autocomplete = (state.data.LootCategories || []).map(c => c.name).filter(Boolean);
            } else if (section === 'LootCategories' && (f.key === 'Loot' || f.key === 'loot')) {
                // when editing a LootCategory, suggest predefined weapon defnames
                autocomplete = (state.data.LCPredefinedWeapons || []).map(w => w.defname).filter(Boolean);
            }
            const editor = createArrayEditor(section + '-' + f.key, existing, autocomplete);
            // store a reference to extract later
            editor._items = existing;
            editor.dataset.field = f.key;
            wrap.appendChild(editor);
        } else {
            const inp = document.createElement('input'); inp.type = (f.type === 'number') ? 'number' : 'text'; inp.name = f.key;
            if (f.type === 'number') inp.value = (typeof value[f.key] !== 'undefined') ? value[f.key] : 0;
            else inp.value = (value[f.key] && Array.isArray(value[f.key])) ? value[f.key].join(',') : (value[f.key] || '');
            wrap.appendChild(inp);
        }
        fields.appendChild(wrap);
    });

    // wire dialog buttons
    const btnOk = document.getElementById('btnOk');
    const btnCancel = document.getElementById('btnCancel');

    // validation helpers
    function validatePosLine(line) {
        // basic pattern: three floats, pipe, three floats (angles)
        // examples: "10159.658203 248.123947 5535.251953|73.000000 0.000000 0.000000"
        const re = /^\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*\|\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*$/;
        return re.test(line);
    }

    const onOk = () => {
        const formValues = {};
        const errors = [];

        schema.forEach(f => {
            // array-editor fields were added as elements with dataset.field
            if (f.type === 'text' && (f.key === 'chest' || f.key === 'loot' || f.key === 'attachments' || f.key === 'Loot')) {
                const editor = fields.querySelector('.array-editor[data-field="' + f.key + '"]') || fields.querySelector('[data-field="' + f.key + '"]');
                // fallback: find by dataset on element we returned earlier
                let items = null;
                if (editor && editor._items) items = editor._items;
                // if our editor wasn't found, look for any element that has dataset.field
                if (!items) {
                    const anyEditor = fields.querySelector('[data-field="' + f.key + '"]');
                    if (anyEditor && anyEditor._items) items = anyEditor._items;
                }
                formValues[f.key] = items || [];
            } else {
                const el = fields.querySelector('[name="' + f.key + '"]');
                if (!el) return;
                if (f.type === 'number') {
                    formValues[f.key] = Number(el.value || 0);
                } else if (f.key === 'pos') {
                    // pos expects array of lines
                    const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    formValues[f.key] = lines;
                } else {
                    formValues[f.key] = el.value;
                }
            }
        });

        // run validations for LootChestsLocations specific rules
        if (section === 'LootChestsLocations') {
            // check required name
            if (!formValues.name || String(formValues.name).trim() === '') errors.push('Name is required');
            // lootrandomize between 0 and 1
            if (typeof formValues.lootrandomize !== 'undefined') {
                const v = Number(formValues.lootrandomize);
                if (isNaN(v) || v < 0 || v > 1) errors.push('lootrandomize must be a number between 0 and 1');
            }
            // pos lines format
            if (Array.isArray(formValues.pos)) {
                formValues.pos.forEach((line, i) => {
                    if (!validatePosLine(line)) errors.push('pos line ' + (i + 1) + ' has invalid format: ' + line);
                });
            }
        }

        // basic validation for LCPredefinedWeapons
        if (section === 'LCPredefinedWeapons') {
            if (!formValues.defname || String(formValues.defname).trim() === '') errors.push('defname is required');
        }

        // basic validation for LootCategories
        if (section === 'LootCategories') {
            if (!formValues.name || String(formValues.name).trim() === '') errors.push('name is required');
            if (formValues.Loot && !Array.isArray(formValues.Loot)) errors.push('Loot must be an array');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n- ' + errors.join('\n- '));
            return; // don't close
        }

        if (!state.data[section]) state.data[section] = [];
        if (index === null) state.data[section].push(formValues);
        else state.data[section][index] = formValues;
        dialog.close();
        renderTab(section);
    };
    const onCancel = () => { dialog.close(); };

    btnOk.onclick = onOk;
    btnCancel.onclick = onCancel;

    dialog.showModal();
}

async function openFile() {
    const res = await window.api.openFile();
    if (!res) return;
    if (res.error) return alert('Error: ' + res.error);
    try {
        const parsed = JSON.parse(res.content);
        // merge into state.data but keep other top-level keys
        state.path = res.path;
        state.data = Object.assign({}, state.data, parsed);
        renderTab(state.currentTab);
        alert('Loaded: ' + res.path);
    } catch (err) {
        alert('Invalid JSON: ' + err.message);
    }
}

async function saveAsFile() {
    const suggested = state.path || 'lootchests.json';
    const fp = await window.api.saveDialog(suggested);
    if (!fp) return;
    const content = JSON.stringify(state.data, null, 2);
    const res = await window.api.writeFile(fp, content);
    if (res && res.error) alert('Save error: ' + res.error);
    else { state.path = fp; alert('Saved to ' + fp); }
}

async function saveFile() {
    if (!state.path) return saveAsFile();
    const content = JSON.stringify(state.data, null, 2);
    const res = await window.api.writeFile(state.path, content);
    if (res && res.error) alert('Save error: ' + res.error);
    else alert('Saved to ' + state.path);
}

async function loadSample() {
    const res = await window.api.readFile('D:/LootChests/sample_config.json');
    if (!res) return alert('Unable to open sample.');
    if (res.error) return alert('Error: ' + res.error);
    try {
        state.data = Object.assign({}, state.data, JSON.parse(res.content));
        renderTab(state.currentTab);
        alert('Sample loaded');
    } catch (err) { alert('Invalid sample JSON: ' + err.message); }
}

window.addEventListener('DOMContentLoaded', init);
