const fs = require('fs');
const TaskStream = require('./TaskStream');
// const ATaskTemplFixedData = require('./ATaskTemplFixedData'); // Будет реализовано далее

class TaskFile {
    constructor() {
        this.tasks = [];
        this.version = 0;
        this.timestamp = 0;
    }

    load(filePath) {
        const buffer = fs.readFileSync(filePath);
        const stream = new TaskStream(buffer);

        // Заголовок
        this.timestamp = stream.readInt32(); // -1819966623
        this.version = stream.readInt32();   // 105, 108, 111, 118
        const questsCount = stream.readInt32();

        console.log(`Загрузка tasks.data: Версия ${this.version}, Количество ${questsCount}`);

        const offsets = [];
        for (let i = 0; i < questsCount; i++) {
            offsets.push(stream.readInt32());
        }

        // Чтение квестов
        const data = {
            version: this.version,
            count: questsCount,
            offsets: offsets,
            stream: stream,
            quests: []
        };

        // Опционально: загрузить все квесты сразу? Или по требованию?
        // JQEditor загружает по требованию (через смещения).
        // Вернем структуру со смещениями.

        return data;
    }

    // Помощник для загрузки конкретного квеста по индексу
    loadQuest(data, index) {
        if (index < 0 || index >= data.offsets.length) return null;

        const offset = data.offsets[index];

        // Валидация офсета: проверяем что он в пределах файла
        // Офсет должен быть положительным и меньше размера буфера
        const bufferSize = data.stream.buffer.length;
        if (offset < 0 || offset >= bufferSize) {
            // Невалидный офсет - пропускаем
            return null;
        }

        data.stream.seek(offset);
        const LoadBinary = require('./core/LoadBinary');
        return LoadBinary.load(data.stream, data.version);
    }

    // Быстрое чтение только ID, имени и флага hasSubtasks (без полного парсинга)
    getQuestBasicInfo(data, index) {
        if (index < 0 || index >= data.offsets.length) return null;

        try {
            const offset = data.offsets[index];

            // Валидация офсета
            const bufferSize = data.stream.buffer.length;
            if (offset < 0 || offset >= bufferSize) {
                return null;
            }

            data.stream.seek(offset);

            // Читаем ID (первое поле, 4 байта)
            const id = data.stream.readInt32();

            // Читаем имя (второе поле, 60 символов)
            const name = data.stream.readTaskChar(60, id);

            // m_nSubCount находится в смещении 0x41C от начала фиксированной структуры
            // (сразу перед динамическими массивами)
            data.stream.seek(offset + 0x41C);
            const subCount = data.stream.readInt32();

            return {
                id: id,
                name: (name || "").replace(/\0/g, ''),
                hasSubtasks: subCount > 0
            };
        } catch (error) {
            // Если не удалось прочитать - возвращаем базовые данные
            return null;
        }
    }
}

module.exports = TaskFile;
