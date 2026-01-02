/**
 * Загрузка структуры AWARD_ITEMS_SCALE (Масштабируемые награды предметов)
 * Основано на libtask/LoadAwardDataItemsScale
 */
const AwardDataParser = require('./AwardDataParser');

class LoadAwardDataItemsScale {
    static load(stream, version) {
        const data = {};

        data.m_ulScales = stream.readUInt32(); // Количество уровней масштабирования
        data.m_ulItemId = stream.readUInt32(); // ID предмета для масштабирования
        data.m_Counts = stream.readBytes(20);  // Массив количества (int[5])

        data.m_Awards = [];
        // Чтение массива наград для каждого масштаба
        for (let i = 0; i < data.m_ulScales; i++) {
            data.m_Awards.push(AwardDataParser.load(stream, version));
        }

        return data;
    }
}

module.exports = LoadAwardDataItemsScale;
