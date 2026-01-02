/**
 * Загрузка описания задачи
 * Основано на libtask/LoadDescriptionBin
 */
class LoadDescriptionBin {
    static load(stream, taskId) {
        const data = {};

        // Чтение длины и текста описания
        const len = stream.readUInt32();
        if (len > 0) {
            // C++: fread(...); convert_txt(..., len, this->m_ID);
            // convert_txt применяет XOR с ID, аналогично readTaskChar
            // Здесь читается основной текст описания квеста
            data.m_pwstrDescript = stream.readTaskChar(len * 2, taskId);
        }

        // Чтение текста "ОК" (при принятии/завершении?)
        const okLen = stream.readUInt32();
        if (okLen > 0) {
            data.m_pwstrOkText = stream.readTaskChar(okLen * 2, taskId);
        }

        // Чтение текста "Нет/Отказ"  
        const noLen = stream.readUInt32();
        if (noLen > 0) {
            data.m_pwstrNoText = stream.readTaskChar(noLen * 2, taskId);
        }

        return data;
    }
}

module.exports = LoadDescriptionBin;
