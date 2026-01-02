/**
 * Загрузка структуры AWARD_RATIO_SCALE (Масштабируемые награды по коэффициенту)
 * Основано на libtask/LoadAwardDataRatioScale
 */
const AwardDataParser = require('./AwardDataParser');

class LoadAwardDataRatioScale {
    static load(stream, version) {
        const data = {};

        data.m_ulScales = stream.readUInt32(); // Количество уровней масштабирования
        data.m_Ratios = stream.readBytes(20);  // Массив коэффициентов (float[5])

        data.m_Awards = [];
        // Чтение массива наград для каждого уровня
        for (let i = 0; i < data.m_ulScales; i++) {
            data.m_Awards.push(AwardDataParser.load(stream, version));
        }

        return data;
    }
}

module.exports = LoadAwardDataRatioScale;
