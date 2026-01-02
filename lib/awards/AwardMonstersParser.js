/**
 * Загрузка структуры AWARD_MONSTERS_SUMMONED (Призываемые монстры в награду)
 * Основано на libtask/LoadAwardMonstersBin
 */
class LoadAwardMonstersBin {
    static load(stream, version, monsterNum) {
        const data = {};

        data.m_ulMonsterNum = monsterNum;
        data.m_bRandChoose = stream.readUInt8();    // Случайный выбор (bool)
        data.m_ulSummonRadius = stream.readUInt32();// Радиус призыва
        data.m_bDeathDisappear = stream.readUInt8();// Исчезать после смерти (bool)

        data.m_Monsters = [];
        for (let i = 0; i < data.m_ulMonsterNum; i++) {
            // IDA: struct MONSTERS_SUMMONED, sizeof=0x10 (16 байт)
            data.m_Monsters.push({
                m_ulMonsterTemplId: stream.readUInt32(),  // 0x00 - ID монстра
                m_ulMonsterNum: stream.readUInt32(),      // 0x04 - Количество
                m_fSummonProb: stream.readFloat(),        // 0x08 - Вероятность
                m_lPeriod: stream.readInt32()             // 0x0C - Период (время существования)
            }); // 16 bytes total
        }

        return data;
    }
}

module.exports = LoadAwardMonstersBin;
