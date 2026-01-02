/**
 * Загрузка структуры AWARD_PQ_RANKING (Награды за рейтинг в Public Quest)
 * Основано на libtask/LoadAwardPQRankingBin
 */
class LoadAwardPQRankingBin {
    static load(stream, version, rankingNum) {
        const data = {};

        data.m_ulRankingAwardNum = rankingNum;
        data.m_bAwardByProf = stream.readUInt8(); // Награда зависит от профессии (bool)

        data.m_RankingAward = [];
        for (let i = 0; i < data.m_ulRankingAwardNum; i++) {
            data.m_RankingAward.push({
                m_iRankingStart: stream.readUInt32(),       // 0x00 - Начало интервала рейтинга
                m_iRankingEnd: stream.readUInt32(),         // 0x04 - Конец интервала рейтинга
                m_bCommonItem: stream.readUInt8(),          // 0x08 - Обычный предмет (bool)
                m_ulAwardItemId: stream.readUInt32(),       // 0x09 - ID предмета
                m_ulAwardItemNum: stream.readUInt32(),      // 0x0D - Количество
                m_lPeriod: stream.readInt32()               // 0x11 - Период действия
            }); // sizeof=0x15 (21 байт)
        }

        return data;
    }
}

module.exports = LoadAwardPQRankingBin;
