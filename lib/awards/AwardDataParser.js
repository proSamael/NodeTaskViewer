const AwardCandParser = require('./AwardCandParser');
const AwardMonstersParser = require('./AwardMonstersParser');
const AwardPQRankingParser = require('./AwardPQRankingParser');

/**
 * Загрузка структуры AWARD_DATA (Награда за квест)
 * Основано на libtask/LoadAwardDataBin
 * Фиксированная структура: 0x105 байт + динамические массивы
 */
class LoadAwardDataBin {
    static load(stream, version) {
        const data = {};

        // Чтение фиксированной структуры 0x105 (261) байт
        const fixedBuffer = stream.readBytes(0x105);
        this.parseFixedStructure(fixedBuffer, data);

        // Загрузка массива вариантов предметов (Candidate items)
        data.m_CandItems = [];
        for (let i = 0; i < data.m_ulCandItems; i++) {
            data.m_CandItems.push(AwardCandParser.load(stream, version));
        }

        // Загрузка призываемых монстров
        if (data.m_ulSummonedMonsters > 0) {
            data.m_SummonedMonsters = AwardMonstersParser.load(stream, version, data.m_ulSummonedMonsters);
        }

        // Загрузка наград за ранжирование PQ (Public Quest)
        if (data.m_ulPQRankingAwardCnt > 0) {
            data.m_PQRankingAward = AwardPQRankingParser.load(stream, version, data.m_ulPQRankingAwardCnt);
        }

        // Загрузка титулов (8 байт каждый)
        data.m_pTitleAward = [];
        for (let i = 0; i < data.m_ulTitleNum; i++) {
            data.m_pTitleAward.push({
                m_ulTitleID: stream.readUInt32(),
                m_lPeriod: stream.readInt32()
            });
        }

        // Загрузка массивов ключей изменения (Change keys)
        if (data.m_ulChangeKeyCnt > 0) {
            data.m_plChangeKey = [];
            data.m_plChangeKeyValue = [];
            data.m_pbChangeType = [];
            for (let i = 0; i < data.m_ulChangeKeyCnt; i++) {
                data.m_plChangeKey.push(stream.readInt32());
                data.m_plChangeKeyValue.push(stream.readInt32());
                data.m_pbChangeType.push(stream.readUInt8());
            }
        }

        // Загрузка массивов изменения истории (History change)
        if (data.m_ulHistoryChangeCnt > 0) {
            data.m_plHistoryChangeKey = [];
            data.m_plHistoryChangeKeyValue = [];
            data.m_pbHistoryChangeType = [];
            for (let i = 0; i < data.m_ulHistoryChangeCnt; i++) {
                data.m_plHistoryChangeKey.push(stream.readInt32());
                data.m_plHistoryChangeKeyValue.push(stream.readInt32());
                data.m_pbHistoryChangeType.push(stream.readUInt8());
            }
        }

        // Загрузка ключей отображения (Display keys)
        if (data.m_ulDisplayKeyCnt > 0) {
            data.m_plDisplayKey = [];
            for (let i = 0; i < data.m_ulDisplayKeyCnt; i++) {
                data.m_plDisplayKey.push(stream.readInt32());
            }
        }

        // Загрузка выражений (Expressions)
        if (data.m_ulExpCnt > 0) {
            data.m_pszExp = [];
            data.m_pExpArr = [];
            for (let i = 0; i < data.m_ulExpCnt; i++) {
                data.m_pszExp.push(stream.readBytes(64));
                const expArr = [];
                for (let j = 0; j < 64; j++) {
                    expArr.push({
                        type: stream.readInt32(),
                        param: stream.readInt32()
                    });
                }
                data.m_pExpArr.push(expArr);
            }
        }

        // Загрузка персонажей задания (Task characters)
        if (data.m_ulTaskCharCnt > 0) {
            data.m_pTaskChar = [];
            for (let i = 0; i < data.m_ulTaskCharCnt; i++) {
                data.m_pTaskChar.push(stream.readWideString(64));
            }
        }

        return data;
    }

    static parseFixedStructure(buffer, data) {
        // Парсинг полной структуры AWARD_DATA (0x105 = 261 байт)
        // Основано на libtask/AWARD_DATA

        data.m_ulGoldNum = buffer.readUInt32LE(0x00);         // Золото
        data.m_ulExp = buffer.readUInt32LE(0x04);             // Опыт
        data.m_ulRealmExp = buffer.readUInt32LE(0x08);        // Дух (Realm Exp - возможно опыт джинна или божественный)
        data.m_bExpandRealmLevelMax = buffer.readUInt8(0x0C); // Расширение макс. уровня (bool)
        data.m_ulNewTask = buffer.readUInt32LE(0x0D);         // ID нового задания
        data.m_ulSP = buffer.readUInt32LE(0x11);              // Очки навыков (SP)
        data.m_lReputation = buffer.readInt32LE(0x15);        // Репутация
        data.m_ulNewPeriod = buffer.readUInt32LE(0x19);       // Новый период (время)
        data.m_ulNewRelayStation = buffer.readUInt32LE(0x1D); // Новая станция реле (телепорт?)
        data.m_ulStorehouseSize = buffer.readUInt32LE(0x21);  // Размер хранилища
        data.m_ulStorehouseSize2 = buffer.readUInt32LE(0x25); // Размер хранилища 2
        data.m_ulStorehouseSize3 = buffer.readUInt32LE(0x29); // Размер хранилища 3
        data.m_ulStorehouseSize4 = buffer.readUInt32LE(0x2D); // Размер хранилища 4
        data.m_lInventorySize = buffer.readInt32LE(0x31);     // Размер инвентаря
        data.m_ulPetInventorySize = buffer.readUInt32LE(0x35);// Размер инвентаря питомцев
        data.m_ulFuryULimit = buffer.readUInt32LE(0x39);      // Лимит ярости (Чи)
        data.m_ulTransWldId = buffer.readUInt32LE(0x3D);      // ID мира для телепортации

        // m_TransPt (ZONE_VERT - 12 bytes at 0x41) - Точка телепортации
        data.m_TransPt = {
            x: buffer.readFloatLE(0x41),
            y: buffer.readFloatLE(0x45),
            z: buffer.readFloatLE(0x49)
        };

        data.m_lMonsCtrl = buffer.readInt32LE(0x4D);          // Контроль монстров (?)
        data.m_bTrigCtrl = buffer.readUInt8(0x51);            // Триггер контроля
        data.m_bUseLevCo = buffer.readUInt8(0x52);            // Использовать коэффициент уровня
        data.m_bDivorce = buffer.readUInt8(0x53);             // Развод (bool)
        data.m_bSendMsg = buffer.readUInt8(0x54);             // Отправить сообщение
        data.m_nMsgChannel = buffer.readInt32LE(0x55);        // Канал сообщения

        // Счетчики динамических массивов
        data.m_ulCandItems = buffer.readUInt32LE(0x59);       // Количество вариантов предметов
        // m_CandItems pointer at 0x5D (skip)
        data.m_ulSummonedMonsters = buffer.readUInt32LE(0x61);// Количество призываемых монстров
        // m_SummonedMonsters pointer at 0x65 (skip)

        data.m_bAwardDeath = buffer.readUInt8(0x69);          // Награда смертью (bool)
        data.m_bAwardDeathWithLoss = buffer.readUInt8(0x6A);  // Смерть с потерей опыта (bool)
        data.m_ulDividend = buffer.readUInt32LE(0x6B);        // Дивиденды (?)
        data.m_bAwardSkill = buffer.readUInt8(0x6F);          // Награда умением (bool)
        data.m_iAwardSkillID = buffer.readInt32LE(0x70);      // ID умения
        data.m_iAwardSkillLevel = buffer.readInt32LE(0x74);   // Уровень умения
        data.m_ulSpecifyContribTaskID = buffer.readUInt32LE(0x78); // ID задания для вклада
        data.m_ulSpecifyContribSubTaskID = buffer.readUInt32LE(0x7C); // ID подзадания для вклада
        data.m_ulSpecifyContrib = buffer.readUInt32LE(0x80);  // Специфический вклад
        data.m_ulContrib = buffer.readUInt32LE(0x84);         // Вклад
        data.m_ulRandContrib = buffer.readUInt32LE(0x88);     // Случайный вклад
        data.m_ulLowestcontrib = buffer.readUInt32LE(0x8C);   // Минимальный вклад
        data.m_iFactionContrib = buffer.readInt32LE(0x90);    // Вклад фракции
        data.m_iFactionExpContrib = buffer.readInt32LE(0x94); // Вклад опыта фракции

        data.m_ulPQRankingAwardCnt = buffer.readUInt32LE(0x98); // Кол-во наград за рейтинг PQ
        // m_PQRankingAward pointer at 0x9C (skip)

        data.m_ulChangeKeyCnt = buffer.readUInt32LE(0xA0);    // Кол-во ключей изменения
        // Pointers at 0xA4, 0xA8, 0xAC (skip)

        data.m_ulHistoryChangeCnt = buffer.readUInt32LE(0xB0);// Кол-во изменений истории
        // Pointers at 0xB4, 0xB8, 0xBC (skip)

        data.m_bMulti = buffer.readUInt8(0xC0);               // Множитель (?)
        data.m_nNumType = buffer.readInt32LE(0xC1);           // Тип номера
        data.m_lNum = buffer.readInt32LE(0xC5);               // Номер

        data.m_ulDisplayKeyCnt = buffer.readUInt32LE(0xC9);   // Кол-во ключей отображения
        // m_plDisplayKey pointer at 0xCD (skip)

        data.m_ulExpCnt = buffer.readUInt32LE(0xD1);          // Кол-во выражений
        // m_pszExp pointer at 0xD5 (skip)
        // m_pExpArr pointer at 0xD9 (skip)

        data.m_ulTaskCharCnt = buffer.readUInt32LE(0xDD);     // Кол-во символов задания
        // m_pTaskChar pointer at 0xE1 (skip)

        data.m_iForceContribution = buffer.readInt32LE(0xE5); // Принудительный вклад
        data.m_iForceReputation = buffer.readInt32LE(0xE9);   // Принудительная репутация
        data.m_iForceActivity = buffer.readInt32LE(0xED);     // Принудительная активность
        data.m_iForceSetRepu = buffer.readInt32LE(0xF1);      // Принудительная установка репутации
        data.m_iTaskLimit = buffer.readInt32LE(0xF5);         // Лимит заданий

        data.m_ulTitleNum = buffer.readUInt32LE(0xF9);        // Количество титулов
        // m_pTitleAward pointer at 0xFD (skip)

        data.m_iLeaderShip = buffer.readInt32LE(0x101);       // Лидерство
    }
}

module.exports = LoadAwardDataBin;
