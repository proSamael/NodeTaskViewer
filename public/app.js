const API_BASE = '/api';

let currentQuestId = null;
let allQuests = [];

// Элементы DOM
const elements = {
    questList: document.getElementById('questList'),
    totalCount: document.getElementById('totalCount'),
    searchInput: document.getElementById('searchInput'),
    welcomeMessage: document.getElementById('welcomeMessage'),
    questDetails: document.getElementById('questDetails'),
    questTitle: document.getElementById('questTitle'),
    questId: document.getElementById('questId'),
    jsonPreview: document.getElementById('jsonPreview')
};

// Состояние дерева
let expandedQuests = new Set();

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadQuests();
    setupSearch();
});

// --- Основная загрузка ---

async function loadQuests() {
    updateLoading(true, 'Fetching quest data...', 10);
    try {
        const response = await fetch(`${API_BASE}/quests`);
        const data = await response.json();

        updateLoading(true, `Processing ${data.total} quests...`, 50);
        allQuests = data.items;

        updateLoading(true, 'Rendering list...', 80);
        elements.totalCount.textContent = `${data.total} Items`;
        renderList(allQuests);

        updateLoading(false);
    } catch (e) {
        console.error(e);
        updateLoading(false);
        elements.questList.innerHTML = '<div style="padding:10px; color:var(--text-error)">Failed to load quests</div>';
    }
}

function updateLoading(show, text, percent) {
    const overlay = document.getElementById('loadingOverlay');
    const status = document.getElementById('loadingStatus');
    const fill = document.getElementById('progressFill');

    if (show) {
        overlay.classList.remove('hidden');
        if (text) status.textContent = text;
        if (percent) fill.style.width = `${percent}%`;
    } else {
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

// --- Рендеринг списка (Боковая панель) ---

function renderList(items) {
    const frag = document.createDocumentFragment();
    // Оптимизация: рендерим ограниченное количество изначально
    const renderItems = items.length > 20000 ? items.slice(0, 5000) : items;

    renderItems.forEach(item => {
        const el = createQuestItem(item, 0);
        frag.appendChild(el);
    });

    elements.questList.innerHTML = '';
    elements.questList.appendChild(frag);
}

// --- Оптимизированная логика дерева ---

function createQuestItem(item, level) {
    const el = document.createElement('div');
    const hasSubtasks = item.hasSubtasks || (item.subtaskCount > 0);

    el.className = `quest-item ${currentQuestId === item.id ? 'active' : ''}`;
    el.style.paddingLeft = `${level * 16 + 8}px`;
    el.dataset.id = item.id;

    // Иконка/Переключатель
    let iconHtml = '<span class="tree-toggle placeholder"></span>';
    if (hasSubtasks) {
        // Проверяем, развернуто ли уже (если мы перерендерим частично, хотя стараемся избегать этого)
        // Пока проще: изначально всегда свернуто, если не отслеживаем состояние сложно.
        // Но так как мы делаем прямые манипуляции с DOM, ожидаем, что 'createQuestItem' вызывается в основном для новых элементов.
        iconHtml = `<span class="tree-toggle">▶</span>`;
    }

    el.innerHTML = `
        ${iconHtml}
        <span class="name">${item.name || '(No Name)'}</span>
        <span class="id">${item.id}</span>
    `;

    // События
    const toggle = el.querySelector('.tree-toggle');
    if (hasSubtasks) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpand(item, el, level);
        });
    }

    el.addEventListener('click', () => {
        // Загрузка деталей
        loadDetail(item.id);

        // Быстрое переключение активности
        const currentActive = document.querySelector('.quest-item.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        el.classList.add('active');
    });

    return el;
}

async function toggleExpand(item, element, level) {
    const nextSibling = element.nextElementSibling;
    const isExpanded = nextSibling && nextSibling.classList.contains('subtasks-container') && nextSibling.dataset.parent == item.id;
    const toggleIcon = element.querySelector('.tree-toggle');

    if (isExpanded) {
        // Свернуть
        nextSibling.remove();
        toggleIcon.textContent = '▶';
        return;
    }

    // Развернуть
    toggleIcon.textContent = '▼'; // Оптимистичное обновление

    // Проверка, нужно ли загружать данные
    if (!item.subtasksLoaded) {
        try {
            toggleIcon.style.opacity = '0.5'; // Состояние загрузки
            const res = await fetch(`${API_BASE}/quests/${item.id}/subtasks`);
            const data = await res.json();

            item.subtasks = data.subtasks || [];
            item.subtasksLoaded = true;
        } catch (e) {
            console.error('Failed to load subtasks', e);
            toggleIcon.textContent = 'x'; // Состояние ошибки
            return;
        } finally {
            toggleIcon.style.opacity = '1';
        }
    }

    // Рендеринг дочерних элементов
    if (item.subtasks && item.subtasks.length > 0) {
        const container = document.createElement('div');
        container.className = 'subtasks-container';
        container.dataset.parent = item.id;

        item.subtasks.forEach(sub => {
            const subEl = createQuestItem(sub, level + 1);
            container.appendChild(subEl);
        });

        element.after(container);
    } else {
        // Есть флаг, но нет фактических подзадач?
        toggleIcon.textContent = '•'; // Индикатор пустоты
    }
}


// --- Поиск ---

function setupSearch() {
    elements.searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
}

function handleSearch(val) {
    const term = val.toLowerCase().trim();

    if (!term) {
        renderList(allQuests);
        return;
    }

    const filtered = allQuests.filter(q =>
        q.id.toString().includes(term) ||
        (q.name && q.name.toLowerCase().includes(term))
    );

    renderList(filtered);
}


// --- Загрузка деталей ---

async function loadDetail(id) {
    try {
        currentQuestId = id;
        elements.welcomeMessage.classList.add('hidden');
        elements.questDetails.classList.remove('hidden');

        // Сначала пробуем кеш
        let quest = allQuests.find(q => q.id === id);

        // Если не полные данные (хотя allQuests обычно имеет их сейчас), загружаем детали
        // Мы предположим простой путь: всегда используем то, что есть, или загружаем при необходимости.
        // Но для RAW просмотра мы полагаемся на то, что server.js отправляет в основном полную информацию.
        // Однако server.js /api/quests отправляет items: taskList.
        // taskList имеет извлеченные свойства fixedData.
        // Если мы хотим ПОЛНУЮ сырую структуру, /api/quests/:id возвращает raw: quest.

        // Проверка, имеет ли кешированный элемент 'raw'.
        if (quest && quest.raw) {
            renderDetail(quest);
        } else {
            const res = await fetch(`${API_BASE}/quests/${id}`);
            const data = await res.json();
            renderDetail(data);
        }
    } catch (e) {
        console.error(e);
        alert('Failed to load quest details');
    }
}

function renderDetailFromObject(quest) {
    currentQuestId = quest.id;
    elements.welcomeMessage.classList.add('hidden');
    elements.questDetails.classList.remove('hidden');
    renderDetail(quest);
}

function renderDetail(quest) {
    elements.questId.textContent = `#${quest.id}`;
    elements.questTitle.textContent = quest.name || 'No Name';

    // Вываливаем всё
    elements.jsonPreview.value = JSON.stringify(quest, null, 4);
}
