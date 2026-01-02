/**
 * Загрузка "Tribute" (дополнительные атрибуты)
 * Основано на libtask/LoadTributeBin
 */
class LoadTributeBin {
    static load(stream, taskId) {
        const data = {};

        const len = stream.readUInt32();
        if (len > 0) {
            // C++: fread(...); convert_txt(..., len, this->m_ID);
            // Чтение строки атрибутов с XOR дешифровкой
            data.m_pwstrTribute = stream.readTaskChar(len * 2, taskId);
        }

        return data;
    }
}

module.exports = LoadTributeBin;
