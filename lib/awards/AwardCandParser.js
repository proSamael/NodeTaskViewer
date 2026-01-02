/**
 * Загрузка структуры AWARD_ITEMS_CAND (Варианты наград)
 * Основано на libtask/LoadAwardCandBin (17 байт + динамический массив)
 */
class LoadAwardCandBin {
    static load(stream, version) {
        const data = {};

        data.m_bRandChoose = stream.readUInt8(); // 1 байт - Случайный выбор (bool)
        data.m_ulAwardItems = stream.readUInt32(); // 4 байта - Количество предметов награды

        data.m_ulAwardCmnItems = 0;
        data.m_ulAwardTskItems = 0;
        data.m_AwardItems = [];

        // Чтение массива ITEM_WANTED (17 байт каждый элемент)
        for (let i = 0; i < data.m_ulAwardItems; i++) {
            const item = {
                m_ulItemTemplId: stream.readUInt32(), // ID шаблона предмета
                m_bCommonItem: stream.readUInt8(),    // Обычный предмет (bool)
                m_ulItemNum: stream.readUInt32(),     // Количество предметов
                m_fProb: stream.readFloat(),          // Вероятность выпадения
                m_lPeriod: stream.readInt32()         // Период действия (Match IDA definition)
            };
            data.m_AwardItems.push(item);

            if (item.m_bCommonItem) {
                data.m_ulAwardCmnItems++;
            } else {
                data.m_ulAwardTskItems++;
            }
        }

        return data;
    }
}

module.exports = LoadAwardCandBin;
