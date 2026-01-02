console.log("TaskEdit Server Starting...");
const express = require('express');
const cors = require('cors');
const path = require('path');
const TaskFile = require('./lib/TaskFile');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Глобальное состояние
let taskData = null;
let taskMap = new Map(); // ID -> Индекс
let taskList = []; // Кешированный список для API

function normalizeWorldId(val) {
    if (!val) return 0;
    // Обработка потенциально перевернутых байтов или World ID в старшем байте (например, 16777216 -> 1)
    if (val > 0xFFFF && (val & 0xFF) === 0) {
        // Проверяем, установлен ли старший байт
        const high = val >>> 24;
        if (high > 0) return high;
    }
    return val;
}

// Помощник: Рекурсивная индексация подзадач, указывающая на тот же индекс корневого файла
function indexQuestTree(quest, rootIndex) {
    if (quest.subtasks && quest.subtasks.length > 0) {
        for (const sub of quest.subtasks) {
            if (sub.fixedData && sub.fixedData.m_ID) {
                // Указываем ID подзадачи на индекс КОРНЕВОГО квеста
                if (!taskMap.has(sub.fixedData.m_ID)) {
                    taskMap.set(sub.fixedData.m_ID, rootIndex);
                }
                indexQuestTree(sub, rootIndex);
            }
        }
    }
}

// Помощник: Найти конкретный узел квеста (корневой или вложенный) по ID
function findQuestNode(root, targetId) {
    if (root.fixedData && root.fixedData.m_ID === targetId) return root;
    if (root.subtasks) {
        for (const sub of root.subtasks) {
            const found = findQuestNode(sub, targetId);
            if (found) return found;
        }
    }
    return null;
}

// Инициализация
const tasksPath = path.join(__dirname, 'tasks.data');
const loader = new TaskFile();

async function init() {
    try {
        console.log('Loading tasks.data...');
        taskData = loader.load(tasksPath);
        console.log(`Loaded version ${taskData.version}, count ${taskData.count}`);

        console.log('Loading full quest data...');
        const startTime = Date.now();

        for (let i = 0; i < taskData.offsets.length; i++) {
            try {
                // Полностью загружаем все данные квеста
                const quest = loader.loadQuest(taskData, i);

                if (quest && quest.fixedData) {
                    // Сохраняем ТОЛЬКО легкие данные для списка
                    const lightQuestData = {
                        id: quest.fixedData.m_ID,
                        name: quest.fixedData.m_szName || '',
                        hasSubtasks: quest.m_nSubCount > 0,
                        subtaskCount: quest.m_nSubCount
                    };

                    taskMap.set(lightQuestData.id, i);
                    taskList.push(lightQuestData);

                    // Рекурсивная индексация
                    indexQuestTree(quest, i);
                }
            } catch (error) {
                // Попытаться получить базовую информацию о квесте для более информативного лога
                let questInfo = `index ${i}`;
                try {
                    const basicInfo = loader.getQuestBasicInfo(taskData, i);
                    if (basicInfo) {
                        questInfo = `index ${i}, ID ${basicInfo.id}, Name "${basicInfo.name}"`;
                    }
                } catch (e) {
                    // Не удалось получить базовую информацию, используем только индекс
                }
                console.error(`Error loading quest at ${questInfo}:`, error.message);
            }

            if (i % 500 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const percent = ((i / taskData.offsets.length) * 100).toFixed(1);
                console.log(`Loaded ${i} / ${taskData.offsets.length} (${percent}%) - ${elapsed}s elapsed`);
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`All quest data loaded in ${totalTime}s`);

    } catch (e) {
        console.error('Failed to load tasks.data:', e);
    }
}

init();

// API

// Получить список - Возвращает полные данные квестов (все закешировано при инициализации)
app.get('/api/quests', (req, res) => {
    if (!taskData) return res.status(500).json({ error: 'Data not loaded' });

    // Вернуть полные закешированные данные квестов
    res.json({
        total: taskData.offsets.length,
        items: taskList // Теперь содержит полные данные квеста
    });
});

// Получить детали квеста по ID
app.get('/api/quests/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!taskMap.has(id)) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        const index = taskMap.get(id);
        const rootQuest = loader.loadQuest(taskData, index);
        const quest = findQuestNode(rootQuest, id);

        if (!quest) {
            return res.status(404).json({ error: 'Quest node not found in tree' });
        }

        // Вернуть полные данные квеста
        res.json({
            id: quest.fixedData.m_ID,
            name: quest.fixedData.m_szName,
            type: quest.fixedData.m_ulType,
            timeLimit: quest.fixedData.m_ulTimeLimit,
            absTime: quest.fixedData.m_bAbsTime,
            absTimeData: quest.fixedData.m_tmAbsTime,
            suitableLevel: quest.fixedData.m_ulSuitableLevel,
            delvNPC: quest.fixedData.m_ulDelvNPC,
            awardNPC: quest.fixedData.m_ulAwardNPC,

            // Требования
            requirements: {
                levelMin: quest.fixedData.m_ulPremise_Lev_Min,
                levelMax: quest.fixedData.m_ulPremise_Lev_Max,
                items: quest.fixedData.m_PremItems || [],
                reputation: quest.fixedData.m_lPremise_Reputation
            },

            // Цели
            targets: {
                monsters: quest.fixedData.m_MonsterWanted || [],
                items: quest.fixedData.m_ItemsWanted || [],
                players: quest.fixedData.m_PlayerWanted || []
            },

            // Награды
            awards: {
                success: quest.fixedData.m_Award_S,
                failure: quest.fixedData.m_Award_F,
                byRatio_S: quest.fixedData.m_AwByRatio_S,
                byRatio_F: quest.fixedData.m_AwByRatio_F,
                byItems_S: quest.fixedData.m_AwByItems_S,
                byItems_F: quest.fixedData.m_AwByItems_F
            },

            // Описание и Диалоги
            description: quest.description,
            tribute: quest.tribute,
            talks: {
                delvTask: quest.m_DelvTaskTalk,
                unqualified: quest.m_UnqualifiedTalk,
                delvItem: quest.m_DelvItemTalk,
                exe: quest.m_ExeTalk,
                award: quest.m_AwardTalk
            },

            // Подквесты
            subtasks: quest.subtasks || [],
            subtaskCount: quest.m_nSubCount,

            // Полные данные для просмотра JSON
            timePeriods: {
                showByPeriod: quest.fixedData.m_bShowByPeriod,
                showStart: (quest.fixedData.m_ulTimetable > 0 && quest.fixedData.m_tmStart && quest.fixedData.m_tmStart.length > 0)
                    ? quest.fixedData.m_tmStart[0]
                    : quest.fixedData.m_tmShowStart,
                showEnd: (quest.fixedData.m_ulTimetable > 0 && quest.fixedData.m_tmEnd && quest.fixedData.m_tmEnd.length > 0)
                    ? quest.fixedData.m_tmEnd[0]
                    : quest.fixedData.m_tmShowEnd,
                showByTime: quest.fixedData.m_bShowByTime,
                periodLimit: quest.fixedData.m_lPeriodLimit,
                timetables: {
                    start: quest.fixedData.m_tmStart || [],
                    end: quest.fixedData.m_tmEnd || []
                }
            },
            raw: quest
        });
    } catch (error) {
        console.error('Error loading quest:', error);
        res.status(500).json({ error: 'Failed to load quest details', message: error.message });
    }
});

// Получить подзадачи для квеста (легковесные - только ID и имена)
app.get('/api/quests/:id/subtasks', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!taskMap.has(id)) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        const index = taskMap.get(id);
        const rootQuest = loader.loadQuest(taskData, index);
        const quest = findQuestNode(rootQuest, id);

        if (!quest) {
            return res.status(404).json({ error: 'Quest node not found in tree' });
        }

        // Извлечь только ID и имя из подзадач
        const subtasks = (quest.subtasks || []).map((st, idx) => ({
            id: st.fixedData?.m_ID || idx,
            name: st.fixedData?.m_szName || `Subtask ${idx}`,
            hasSubtasks: (st.m_nSubCount || 0) > 0
        }));

        res.json({
            questId: id,
            subtaskCount: quest.m_nSubCount || 0,
            subtasks: subtasks
        });
    } catch (error) {
        console.error('Error loading subtasks:', error);
        res.status(500).json({ error: 'Failed to load subtasks', message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
