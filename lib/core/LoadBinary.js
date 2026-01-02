const FixedDataParser = require('./FixedDataParser');
const DescriptionParser = require('./DescriptionParser');
const TributeParser = require('./TributeParser');
const TalkParser = require('./TalkParser');

/**
 * Основной загрузчик бинарных данных задачи (ATaskTempl::LoadBinary)
 * Основано на libtask/LoadFromBinFile lines 9-41
 */
class LoadBinary {
    /**
     * Загрузить задачу и её подзадачи из бинарного потока
     * @param {TaskStream} stream - Бинарный поток, позиционированный на начале задачи
     * @param {number} version - Версия файла квестов
     * @returns {Object} Распарсенный объект задачи
     */
    static load(stream, version) {
        const task = {};

        // 1. Загрузка фиксированной структуры данных
        // Размер: 0x420 байт (1056 байт) фиксированного заголовка + динамические массивы.
        // Содержит основные параметры квеста: ID, имя, требования, награды и т.д.
        task.fixedData = FixedDataParser.load(stream, version);

        // 2. Загрузка описания
        // Текстовый контент квеста: основное описание, текст при успехе/неудаче.
        // Строки зашифрованы XOR (ключ = ID квеста).
        task.description = DescriptionParser.load(stream, task.fixedData.m_ID);

        // 3. Загрузка атрибутов "Tribute"
        // Дополнительные параметры (обычно пустые или служебные).
        task.tribute = TributeParser.load(stream, task.fixedData.m_ID);

        // 4. Пропуск CheckMask
        // В оригинале здесь вызывается CheckMask для валидации данных.
        // Мы пропускаем этот шаг, так как только читаем данные.

        // 5. Загрузка диалогов (talk_proc)
        // Квест содержит 5 типов диалогов для разных ситуаций:
        const code = task.fixedData.m_ID;
        task.m_DelvTaskTalk = TalkParser.load(stream, code);    // Диалог доставки квеста
        task.m_UnqualifiedTalk = TalkParser.load(stream, code); // Диалог при несоответствии требованиям
        task.m_DelvItemTalk = TalkParser.load(stream, code);    // Диалог передачи предметов
        task.m_ExeTalk = TalkParser.load(stream, code);         // Диалог во время выполнения
        task.m_AwardTalk = TalkParser.load(stream, code);       // Диалог выдачи награды

        // 6. Загрузка количества подзадач
        task.m_nSubCount = stream.readUInt32();

        // 7. Рекурсивная загрузка подзадач
        // Подзадачи имеют ту же структуру, что и основной квест.
        task.subtasks = [];
        for (let i = 0; i < task.m_nSubCount; i++) {
            const subtask = LoadBinary.load(stream, version);
            task.subtasks.push(subtask);
        }

        return task;
    }
}

module.exports = LoadBinary;
