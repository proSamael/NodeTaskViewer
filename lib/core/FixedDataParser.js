const TaskStructs = require('../structs/TaskStructs');
const AwardDataParser = require('../awards/AwardDataParser');
const AwardItemsScaleParser = require('../awards/AwardItemsScaleParser');
const AwardRatioScaleParser = require('../awards/AwardRatioScaleParser');

/**
 * Загрузка фиксированной структуры данных (ATaskTemplFixedData)
 * Основано на libtask/LoadFixedDataFromBinFile
 * 
 * Читает:
 * 1. Фиксированная структура: 0x420 байт (1056 байт)
 * 2. Динамические массивы на основе счётчиков из фиксированной структуры
 * 3. Структуры данных наград
 */
class FixedDataParser {
    /**
     * Загрузить фиксированные данные квеста из бинарного потока
     * @param {TaskStream} stream - Бинарный поток
     * @param {number} version - Версия файла квестов
     * @returns {Object} Объект распарсенных фиксированных данных
     */
    static load(stream, version) {
        const data = {};

        // Читаем фиксированные 0x420 байт напрямую в объект data
        // Следуя оффсетам libtask/structATaskTemplFixedData
        const startPos = stream.getPosition();

        data.m_ID = stream.readUInt32(); // 0x00 ID квеста
        data.m_szName = stream.readTaskChar(60, data.m_ID); // 0x04 Название квеста (60 байт, XOR шифрование с ID)
        data.m_bHasSign = stream.readUInt8(); // 0x40 Имеет подпись?

        // Пропускаем указатель (4 байта) - прочитаем подпись позже, если нужно
        stream.readBytes(4); // 0x41

        data.m_ulType = stream.readUInt32(); // 0x45 Тип квеста
        data.m_ulTimeLimit = stream.readUInt32(); // 0x49 Ограничение по времени

        // Переход к счётчику временных таблиц на 0x69
        // Пропуск 0x4D-0x69 (28 байт)
        data.m_bAbsTime = stream.readUInt32(); // 0x4D Абсолютное время (BOOL)
        data.m_tmAbsTime = TaskStructs.readTaskTm(stream); // 0x51 Дата абсолютного времени (task_tm 24 bytes)

        // Поток сейчас на позиции 0x69
        data.m_ulTimetable = stream.readUInt32(); // 0x69 Кол-во записей расписания

        // Пропуск 0x6D - 0xA9 (60 байт)
        data.m_bShowByPeriod = stream.readUInt32();      // 0x6D Показать по периоду
        data.m_tmShowStart = TaskStructs.readTaskTm(stream); // 0x71 Начало показа
        data.m_tmShowEnd = TaskStructs.readTaskTm(stream);   // 0x89 Конец показа
        // 0xA1
        data.m_bShowByTime = stream.readUInt8();         // 0xA1 Показать по времени
        stream.readBytes(2); // Отступ 0xA2-0xA3

        // 0xA4
        data.m_bDelvInZone = stream.readUInt8();         // 0xA4 Сдача в зоне
        data.m_ulDelvWorld = stream.readUInt32();        // 0xA5 Мир сдачи
        data.m_ulDelvRegionCnt = stream.readUInt32();    // 0xA9 Кол-во регионов сдачи
        data.m_pDelvRegionPtr = stream.readUInt32();     // 0xAD Указатель на регионы сдачи (ptr)

        data.m_bEnterRegionFail = stream.readUInt8();    // 0xB1 Провал при входе в регион
        data.m_ulEnterRegionWorld = stream.readUInt32(); // 0xB2 Мир входа
        data.m_ulEnterRegionCnt = stream.readUInt32();   // 0xB6 Кол-во регионов входа
        data.m_pEnterRegionPtr = stream.readUInt32();    // 0xBA Указатель на регионы входа (ptr)

        data.m_bLeaveRegionFail = stream.readUInt8();    // 0xBE Провал при выходе из региона
        data.m_ulLeaveRegionWorld = stream.readUInt32(); // 0xBF Мир выхода
        data.m_ulLeaveRegionCnt = stream.readUInt32();   // 0xC3 Кол-во регионов выхода
        data.m_pLeaveRegionPtr = stream.readUInt32();    // 0xC7 Указатель на регионы выхода (ptr)

        data.m_bLeaveForceFail = stream.readUInt8();     // 0xCB Провал при смене фракции
        stream.readBytes(4); // Отступ/Неизвестно до 0xD0 (0xCB+1=0xCC, нужно 4 байта? 0xD0-0xCC=4)

        // Продолжение ручного последовательного чтения
        stream.seek(startPos + 0xE8);
        data.m_ulSuitableLevel = stream.readUInt32();    // 0xE8 Подходящий уровень
        stream.seek(startPos + 0xEE);
        data.m_ulDelvNPC = stream.readUInt32();          // 0xEE NPC сдачи
        stream.seek(startPos + 0xF2);
        data.m_ulAwardNPC = stream.readUInt32();         // 0xF2 NPC награды

        stream.seek(startPos + 0xFA);
        data.m_ulChangeKeyCnt = stream.readUInt32();     // 0xFA Кол-во ключевых предметов

        stream.seek(startPos + 0x11D);
        data.m_ulPQExpCnt = stream.readUInt32();         // 0x11D Кол-во выражений PQ
        stream.seek(startPos + 0x12B);
        data.m_ulMonsterContribCnt = stream.readUInt32(); // 0x12B Кол-во вкладов монстров

        // Новые чтения для Требований (Пропуск 0x12F - 0x16B)
        data.m_ulPremise_Lev_Min = stream.readUInt32(); // 0x12F Мин. уровень
        data.m_ulPremise_Lev_Max = stream.readUInt32(); // 0x133 Макс. уровень
        data.m_ulPremise_Sex = stream.readUInt32();     // 0x137 Пол
        data.m_lPremise_Reputation = stream.readInt32(); // 0x13B Репутация
        data.m_lPremise_ReputationMax = stream.readInt32(); // 0x13F Макс. репутация
        data.m_ulPremise_Cotrib = stream.readUInt32();  // 0x143 Вклад
        data.m_ulGoldWanted = stream.readUInt32();      // 0x147 Требуемое золото
        data.m_ulOccupations = stream.readUInt32();     // 0x14B Классы (Маска)
        data.m_ulPremise_Spouse = stream.readUInt32();  // 0x14F Супруг(а)
        data.m_bPremise_Spouse_Married = stream.readUInt8(); // 0x153 Женат/Замужем
        data.m_bPremise_Spouse_Divorced = stream.readUInt8(); // 0x154 Разведен(а)
        stream.readBytes(2); // Отступ/Неизвестно 0x155-0x156
        data.m_ulPremise_RealmExp = stream.readUInt32(); // 0x157 Опыт владений?

        // Пропуск 0x15B - 0x16B (16 байт) -> Требования к ремеслам?
        data.m_ulPremise_LivingSkill_1 = stream.readInt32(); // Ремесло 1 (Кузнец?)
        data.m_ulPremise_LivingSkill_2 = stream.readInt32(); // Ремесло 2 (Портной?)
        data.m_ulPremise_LivingSkill_3 = stream.readInt32(); // Ремесло 3 (Ремесленник?)
        data.m_ulPremise_LivingSkill_4 = stream.readInt32(); // Ремесло 4 (Аптекарь?)


        // Поток сейчас на позиции 0x16B (после Ремесел)
        data.m_ulPremItems = stream.readUInt32();       // 0x16B Требуемые предметы
        data.m_bPremItemsAnyOne = stream.readUInt8();   // 0x16F Любой из предметов

        stream.readBytes(5); // Отступ/Неизвестно 0x170-0x175 (Вероятно Premise_Deposit + Отступ)

        data.m_ulGivenItems = stream.readUInt32();      // 0x176 Выдаваемые предметы
        data.m_ulGivenCmnCount = stream.readUInt32();   // 0x179 Кол-во обычных предметов
        data.m_ulGivenTskCount = stream.readUInt32();   // 0x17D Кол-во квестовых предметов
        data.m_bGivenCompulsory = stream.readUInt8();   // 0x181 Обязательная выдача
        data.m_bCheckCourier = stream.readUInt8();      // 0x182 Проверка курьера
        data.m_bCompulsoryFailDelete = stream.readUInt8(); // 0x183 Удалять при провале

        data.m_ulPremAppointedTime = stream.readUInt32(); // 0x184 Назначенное время

        data.m_bPremCheckReincarnation = stream.readUInt8(); // 0x188 Проверка перерождения
        data.m_ulPremReincarnationMin = stream.readUInt32(); // 0x189 Мин. перерождение
        data.m_ulPremReincarnationMax = stream.readUInt32(); // 0x18D Макс. перерождение

        data.m_bPremCheckRealmLevel = stream.readUInt8();    // 0x191 Проверка уровня небес
        data.m_ulPremRealmLevelMin = stream.readUInt32();    // 0x192 Мин. уровень небес
        data.m_ulPremRealmLevelMax = stream.readUInt32();    // 0x196 Макс. уровень небес

        data.m_bPremCheckTitle = stream.readUInt8();         // 0x19A Проверка титула
        data.m_ulPremTitleNum = stream.readUInt32();         // 0x19B Номер титула
        data.m_plPremTitle = [];
        for (let i = 0; i < 5; i++) {
            data.m_plPremTitle.push(stream.readInt32()); // 0x19F - 0x1B3 Список титулов
        }

        // Проверка: История
        data.m_bPremCheckHistory = stream.readUInt8();       // 0x1B4 Проверка истории
        stream.readBytes(3); // Отступ
        data.m_iPremHistoryIndex = stream.readInt32();       // 0x1B8 Индекс истории
        data.m_iPremHistoryValue = stream.readInt32();       // 0x1BC Значение истории

        // Проверка: Фракция
        data.m_bPremCheckForce = stream.readUInt8();         // 0x1C0 Проверка фракции
        stream.readBytes(3); // Отступ
        data.m_iPremForce = stream.readInt32();              // 0x1C4 Фракция
        data.m_iPremForceReputation = stream.readInt32();    // 0x1C8 Репутация фракции

        // Проверка: Карта
        data.m_bPremCheckCard = stream.readUInt8();          // 0x1CC Проверка карт
        stream.readBytes(3); // Отступ
        data.m_iPremCard = stream.readInt32();               // 0x1D0 Карта

        // Проверка: Карта полководца (1.5.1+)
        data.m_bPremCheckGeneralCard = stream.readUInt8();   // 0x1D4 Проверка карт полководца
        stream.readBytes(3); // Отступ
        data.m_iPremGeneralCard = stream.readInt32();        // 0x1D8 Карта полководца

        // Проверка: Состояние иконки
        data.m_bPremCheckIcon = stream.readUInt8();          // 0x1DC Проверка иконки
        stream.readBytes(3); // Отступ
        data.m_iPremIconState = stream.readInt32();          // 0x1E0 Состояние иконки

        // Проверка: Метки (Типы задач)
        data.m_ulPremLabelNum = stream.readUInt32();         // 0x1E4 Кол-во меток
        data.m_plPremLabel = [];
        for (let i = 0; i < 5; i++) {
            data.m_plPremLabel.push(stream.readInt32());     // 0x1E8 + i*4 Метки
        }
        // Конец меток ~0x1FC

        // Проверка: Переменные задачи
        data.m_bPremCheckTaskVar = stream.readUInt8();       // 0x1FC Проверка переменных задачи
        stream.readBytes(3); // Отступ
        data.m_ulPremTaskVarNum = stream.readUInt32();       // 0x200 Кол-во переменных
        data.m_plPremTaskVar = [];
        data.m_plPremTaskVarValue = [];
        for (let i = 0; i < 5; i++) {
            data.m_plPremTaskVar.push(stream.readInt32());   // 0x204 + i*8 Переменная
            data.m_plPremTaskVarValue.push(stream.readInt32()); // Значение
        } // 5 * 8 = 40 байт. Конец на 0x22C

        // Проверка: Дом
        data.m_bPremCheckHouse = stream.readUInt8();         // 0x22C Проверка дома
        stream.readBytes(3); // Отступ
        data.m_ulPremHouseLevelMin = stream.readUInt32();    // 0x230 Мин. уровень дома
        data.m_ulPremHouseLevelMax = stream.readUInt32();    // 0x234 Макс. урованя дома

        // Проверка: Ранг (Арена/Снаряжение?)
        data.m_bPremCheckRank = stream.readUInt8();          // 0x238 Проверка ранга
        stream.readBytes(3); // Отступ
        data.m_ulPremRankMin = stream.readUInt32();          // 0x23C Мин. ранг
        data.m_ulPremRankMax = stream.readUInt32();          // 0x240 Макс. ранг

        // Проверка: Месячная карта
        data.m_bPremCheckMonthCard = stream.readUInt8();     // 0x244 Проверка месячной карты
        // Проверка: VIP уровень
        data.m_bPremCheckVIPLevel = stream.readUInt8();      // 0x245 Проверка VIP уровня
        stream.readBytes(2); // Отступ
        data.m_ulPremVIPLevelMin = stream.readUInt32();      // 0x248 Мин. VIP
        data.m_ulPremVIPLevelMax = stream.readUInt32();      // 0x24C Макс. VIP

        // Проверка: Меридиан
        data.m_bPremCheckMeridian = stream.readUInt8();      // 0x250 Проверка меридиана
        data.m_bPremCheckMeridianContinuity = stream.readUInt8(); // 0x251 Проверка непрерывности меридиана
        stream.readBytes(2); // Отступ
        data.m_ulPremMeridianLevelMin = stream.readUInt32(); // 0x254 Мин. уровень меридиана
        data.m_ulPremMeridianLevelMax = stream.readUInt32(); // 0x258 Макс. уровень меридиана

        // Проверка: Публичный/Командный матч
        data.m_bPremCheckMatchPublic = stream.readUInt8();   // 0x25C Публичный матч
        data.m_bPremCheckMatchTeam = stream.readUInt8();     // 0x25D Командный матч
        stream.readBytes(2); // Отступ

        // Проверка: Форма трансформации
        data.m_bPremCheckTransformedForm = stream.readUInt8(); // 0x260 Проверка формы трансформации
        stream.readBytes(3); // Отступ
        data.m_ulPremTransformedForm = stream.readUInt32();    // 0x264 Форма трансформации

        // Проверка: Руны (1.5.5+)
        if (version >= 118) {
            data.m_bPremCheckRune = stream.readUInt8();          // 0x268 Проверка рун
            stream.readBytes(3); // Отступ
            data.m_ulPremRuneCode = stream.readUInt32();         // 0x26C Код руны
            data.m_ulPremRuneLevel = stream.readUInt32();        // 0x270 Уровень руны

            // Проверка: Новый титул (Специфичный)
            data.m_bPremCheckTitleNew = stream.readUInt8();      // 0x274 Проверка новых титулов
            stream.readBytes(3); // Отступ
            data.m_ulPremTitleNumNew = stream.readUInt32();      // 0x278 Кол-во новых титулов
            data.m_plPremTitleNew = []; // Обычно 1? Или массив?
            data.m_plPremTitleNew.push(stream.readInt32());      // 0x27C Титул 1
            data.m_plPremTitleNew.push(stream.readInt32());      // 0x280 Титул 2

            // Проверка: Карты полководца (1.5.5+)
            // Флаги (4 байта)
            data.m_bPremCheckWarAvatarCollection = stream.readUInt8(); // 0x284 Проверка коллекции карт
            data.m_bPremCheckWarAvatar = stream.readUInt8();           // 0x285 Проверка карт
            data.m_bPremCheckHistory2 = stream.readUInt8();            // 0x286 Проверка истории 2
            stream.readBytes(1); // Отступ 0x287

            // Значения (12 байт)
            data.m_ulPremWarAvatarCollection = stream.readInt32();     // 0x288 Коллекция карт
            data.m_ulPremWarAvatar = stream.readInt32();               // 0x28C Карта
            data.m_ulPremHistory2 = stream.readInt32();                // 0x290 История 2
            data.m_ulPremUnk1 = stream.readUInt8();                      // 0x294
            data.m_ulPremUnk2 = stream.readUInt8();                      // 0x295
            // Отступ (1 байт) до 0x296
            stream.readBytes(1);                                       // 0x296
        } else {
            // Для старых версий пропускаем эти поля для сохранения выравнивания
            // 0x296 - 0x268 = 46 байт
            stream.readBytes(46);
        }

        // Проверка выравнивания на 0x296
        const currentPos = stream.getPosition();
        const expectedPos = startPos + 0x296;
        if (currentPos !== expectedPos) {
            console.log(`FixedDataParser: Alignment warning at 0x296. Relative pos: 0x${(currentPos - startPos).toString(16)} (Diff: ${currentPos - expectedPos})`);
            stream.seek(expectedPos);
        }

        // Поток сейчас на 0x296
        data.m_bTeamwork = stream.readUInt8();       // 0x296 Командная задача
        data.m_bRcvByTeam = stream.readUInt8();      // 0x297 Прием командой
        data.m_bSharedTask = stream.readUInt8();     // 0x298 Общая задача
        data.m_bSharedLevel = stream.readUInt8();    // 0x299 Общий уровень
        data.m_bCheckTeammate = stream.readUInt8();  // 0x29A Проверка сопартийца
        stream.readBytes(1); // Отступ на 0x29B
        data.m_fRcvDist = stream.readFloat();        // 0x29C Дистанция приема
        data.m_fSucceedDist = stream.readFloat();    // 0x2A0 Дистанция успеха
        data.m_bAllFail = stream.readUInt8();        // 0x2A4 Провал всех
        data.m_bCapFail = stream.readUInt8();        // 0x2A5 Провал капитана
        data.m_bDismAsSelfFail = stream.readUInt8(); // 0x2A6 Провал при роспуске
        data.m_bRcvChckMem = stream.readUInt8();     // 0x2A7 Проверка членов при приеме
        data.m_fRcvMemDist = stream.readFloat();     // 0x2A8 Дистанция проверки членов

        data.m_bCntByMemPos = stream.readUInt8();    // 0x2AC Считать по позиции
        data.m_fCntMemDist = stream.readFloat();     // 0x2AD Дистанция счета
        data.m_bAllSucc = stream.readUInt8();        // 0x2B1 Успех всех
        data.m_bCoupleOnly = stream.readUInt8();     // 0x2B2 Только для пар
        data.m_bDistinguishedOcc = stream.readUInt8(); // 0x2B3 Уникальные классы

        // Поток сейчас на 0x2B4
        data.m_ulTeamMemsWanted = stream.readUInt32();   // 0x2B4 Требуемые члены команды
        data.m_pTeamMemsWanted = stream.readUInt32();    // 0x2B8 Указатель на членов команды (ptr)
        data.m_bShowByTeam = stream.readUInt8();         // 0x2BC Показать по команде
        data.m_bPremNeedComp = stream.readUInt8();       // 0x2BD Требуется сравнение (Пререквизит)
        data.m_nPremExp1AndOrExp2 = stream.readInt32();  // 0x2BE Логика сравнения (AND/OR)
        data.m_Prem1KeyValue = TaskStructs.readCompareKeyValue(stream); // 0x2C2 Значение сравнения 1 (20 байт)
        data.m_Prem2KeyValue = TaskStructs.readCompareKeyValue(stream); // 0x2D6 Значение сравнения 2 (20 байт)

        // Поля фракции 0x2EA - 0x30D
        data.m_bPremCheckForce = stream.readUInt8();           // 0x2EA Проверка фракции (Детально)
        data.m_iPremForce = stream.readInt32();                // 0x2EB Фракция
        data.m_bShowByForce = stream.readUInt8();              // 0x2EF Показать по фракции
        data.m_iPremForceReputation = stream.readInt32();      // 0x2F0 Репутация фракции
        data.m_bShowByForceReputation = stream.readUInt8();    // 0x2F4 Показать по репутации
        data.m_iPremForceContribution = stream.readInt32();    // 0x2F5 Вклад фракции
        data.m_bShowByForceContribution = stream.readUInt8();  // 0x2F9 Показать по вкладу
        data.m_iPremForceExp = stream.readInt32();             // 0x2FA Опыт фракции
        data.m_bShowByForceExp = stream.readUInt8();           // 0x2FE Показать по опыту
        data.m_iPremForceSP = stream.readInt32();              // 0x2FF Очки фракции (SP)
        data.m_bShowByForceSP = stream.readUInt8();            // 0x303 Показать по SP
        data.m_iPremForceActivityLevel = stream.readInt32();   // 0x304 Уровень активности
        data.m_bShowByForceActivityLevel = stream.readUInt8(); // 0x308 Показать по активности
        data.m_bPremIsKing = stream.readUInt8();               // 0x309 Является королем
        data.m_bShowByKing = stream.readUInt8();               // 0x30A Показать по королю
        data.m_bPremNotInTeam = stream.readUInt8();            // 0x30B Не в команде
        data.m_bShowByNotInTeam = stream.readUInt8();          // 0x30C Показать по "не в команде"

        // Поток сейчас на 0x30D
        data.m_iPremTitleNumTotal = stream.readUInt32();       // 0x30D Общее кол-во титулов
        data.m_iPremTitleNumRequired = stream.readUInt32();    // 0x311 Требуемое кол-во титулов
        data.m_pPremTitles = stream.readUInt32();              // 0x315 Указатель на список титулов (ptr)
        data.m_bShowByTitle = stream.readUInt8();              // 0x319 Показать по титулу

        data.m_iPremHistoryStageIndex = [];
        data.m_iPremHistoryStageIndex.push(stream.readInt32()); // 0x31A Индекс этапа истории 1
        data.m_iPremHistoryStageIndex.push(stream.readInt32()); // 0x31E Индекс этапа истории 2

        data.m_bShowByHistoryStage = stream.readUInt8();       // 0x322 Показать по этапу истории
        data.m_ulPremGeneralCardCount = stream.readUInt32();   // 0x323 Кол-во карт полководца
        data.m_bShowByGeneralCard = stream.readUInt8();        // 0x327 Показать по картам
        data.m_iPremGeneralCardRank = stream.readInt32();      // 0x328 Ранг карты
        data.m_ulPremGeneralCardRankCount = stream.readUInt32(); // 0x32C Кол-во карт ранга
        data.m_bShowByGeneralCardRank = stream.readUInt8();    // 0x330 Показать по рангу карт
        data.m_enumMethod = stream.readUInt32();               // 0x331 Метод (Enum)
        data.m_enumFinishType = stream.readUInt32();           // 0x335 Тип завершения

        // Поток сейчас на 0x339
        data.m_ulPlayerWanted = stream.readUInt32();     // 0x339 Требуемые игроки
        data.m_pPlayerWanted = stream.readUInt32();      // 0x33D Указатель на игроков (ptr)

        data.m_ulMonsterWanted = stream.readUInt32();    // 0x341 Требуемые монстры
        data.m_pMonsterWanted = stream.readUInt32();     // 0x345 Указатель на монстров (ptr)

        data.m_ulItemsWanted = stream.readUInt32();      // 0x349 Требуемые предметы
        data.m_pItemsWanted = stream.readUInt32();       // 0x34D Указатель на предметы (ptr)

        data.m_ulGoldWanted = stream.readUInt32();       // 0x351 Требуемое золото
        data.m_iFactionContribWanted = stream.readInt32(); // 0x355 Требуемый вклад
        data.m_iFactionExpContribWanted = stream.readInt32(); // 0x359 Требуемый опыт вклада
        data.m_ulNPCToProtect = stream.readUInt32();     // 0x35D NPC для защиты
        data.m_ulProtectTimeLen = stream.readUInt32();   // 0x361 Время защиты
        data.m_ulNPCMoving = stream.readUInt32();        // 0x365 Задача сопровождения NPC
        data.m_ulNPCDestSite = stream.readUInt32();      // 0x369 Место назначения NPC
        data.m_pReachSite = stream.readUInt32();         // 0x36D Указатель на регионы прибытия (ptr)

        // Поток сейчас на 0x371
        data.m_ulReachSiteCnt = stream.readUInt32();     // 0x371 Кол-во регионов прибытия
        data.m_ulReachSiteId = stream.readUInt32();      // 0x375 ID места
        data.m_ulWaitTime = stream.readUInt32();         // 0x379 Время ожидания
        data.m_TreasureStartZone = TaskStructs.readZoneVert(stream); // 0x37D Зона сокровищ (12 байт)
        data.m_ucZonesNumX = stream.readUInt8();         // 0x389 Зоны X
        data.m_ucZonesNumZ = stream.readUInt8();         // 0x38A Зоны Z
        data.m_ucZoneSide = stream.readUInt8();          // 0x38B Сторона зоны
        data.m_pLeaveSite = stream.readUInt32();         // 0x38C Указатель на выход из зоны (ptr)

        // Поток сейчас на 0x390
        data.m_ulLeaveSiteCnt = stream.readUInt32();     // 0x390 Кол-во зон выхода
        data.m_ulLeaveSiteId = stream.readUInt32();      // 0x394 ID зоны выхода
        data.m_bFinNeedComp = stream.readUInt8();        // 0x398 Требуется сравнение (Финиш)
        data.m_nFinExp1AndOrExp2 = stream.readInt32();   // 0x399 Логика сравнения
        data.m_Fin1KeyValue = TaskStructs.readCompareKeyValue(stream); // 0x39D Значение сравнения 1 (20 байт)
        data.m_Fin2KeyValue = TaskStructs.readCompareKeyValue(stream); // 0x3B1 Значение сравнения 2 (20 байт)

        // Поток сейчас на 0x3C5
        data.m_ulExpCnt = stream.readUInt32();           // 0x3C5 Кол-во выражений
        data.m_pszExp = stream.readUInt32();             // 0x3C9 Указатель на строки выражений (ptr)
        data.m_pExpArr = stream.readUInt32();            // 0x3CD Указатель на массив выражений (ptr)

        // Поток сейчас на 0x3D1
        data.m_ulTaskCharCnt = stream.readUInt32();      // 0x3D1 Кол-во task_char
        data.m_pTaskChar = stream.readUInt32();          // 0x3D5 Указатель на task_char (ptr)

        data.m_ucTransformedForm = stream.readUInt8();   // 0x3D9 Форма трансформации
        data.m_ulReachLevel = stream.readUInt32();       // 0x3DA Достичь уровня
        data.m_ulReachReincarnationCount = stream.readUInt32(); // 0x3DE Достичь перерождения
        data.m_ulReachRealmLevel = stream.readUInt32();  // 0x3E2 Достичь уровня небес
        data.m_uiEmotion = stream.readUInt32();          // 0x3E6 Эмоция

        data.m_ulAwardType_S = stream.readUInt32();      // 0x3EA Тип награды (Успех)
        data.m_ulAwardType_F = stream.readUInt32();      // 0x3EE Тип награды (Провал)

        data.m_pAward_S = stream.readUInt32();           // 0x3F2 Указатель на награду (Успех)
        data.m_pAward_F = stream.readUInt32();           // 0x3F6 Указатель на награду (Провал)
        data.m_pAwByRatio_S = stream.readUInt32();       // 0x3FA Указатель на награду Ratio (Успех)
        data.m_pAwByRatio_F = stream.readUInt32();       // 0x3FE Указатель на награду Ratio (Провал)
        data.m_pAwByItems_S = stream.readUInt32();       // 0x402 Указатель на награду Items (Успех)
        data.m_pAwByItems_F = stream.readUInt32();       // 0x406 Указатель на награду Items (Провал)

        data.m_ulParent = stream.readUInt32();           // 0x40A Родительский квест
        data.m_ulPrevSibling = stream.readUInt32();      // 0x40E Предыдущий брат
        data.m_ulNextSibling = stream.readUInt32();      // 0x412 Следующий брат
        data.m_ulFirstChild = stream.readUInt32();       // 0x416 Первый дочерний квест

        data.m_bIsLibraryTask = stream.readUInt8();      // 0x41A Библиотечный квест
        data.m_fLibraryTasksProbability = stream.readFloat(); // 0x41B Вероятность
        data.m_bIsUniqueStorageTask = stream.readUInt8(); // 0x41F Уникальный квест хранилища

        // Конец структуры, должно быть 0x420
        // stream.seek(startPos + 0x420);

        // Читаем подпись, если присутствует
        if (data.m_bHasSign) {
            data.m_pszSignature = stream.readWideString(30); // 60 байт (Подпись)
        }

        // Читаем массивы временных таблиц
        if (data.m_ulTimetable > 0) {
            data.m_tmStart = [];
            data.m_tmEnd = [];
            for (let i = 0; i < data.m_ulTimetable; i++) {
                data.m_tmStart.push(TaskStructs.readTaskTm(stream));
                data.m_tmEnd.push(TaskStructs.readTaskTm(stream));
            }
        }


        // ===== Динамические массивы (в порядке из LoadFixedDataFromBinFile) =====

        // 1. m_plChangeKey / m_plChangeKeyValue / m_pbChangeType
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

        // 2. m_pszPQExp / m_pPQExpArr
        if (data.m_ulPQExpCnt > 0) {
            data.m_pszPQExp = [];
            data.m_pPQExpArr = [];
            for (let i = 0; i < data.m_ulPQExpCnt; i++) {
                // Читаем строку выражения (char[64])
                data.m_pszPQExp.push(stream.readBytes(64));
                // Читаем массив TASK_EXPRESSION[64]
                const expArray = [];
                for (let j = 0; j < 64; j++) {
                    expArray.push(TaskStructs.readTaskExpression(stream));
                }
                data.m_pPQExpArr.push(expArray);
            }
        }

        // 3. m_MonstersContrib
        if (data.m_ulMonsterContribCnt > 0) {
            data.m_MonstersContrib = [];
            for (let i = 0; i < data.m_ulMonsterContribCnt; i++) {
                data.m_MonstersContrib.push(TaskStructs.readMonstersContrib(stream));
            }
        }

        // 4. m_pDelvRegion
        if (data.m_ulDelvRegionCnt > 0) {
            data.m_pDelvRegion = [];
            for (let i = 0; i < data.m_ulDelvRegionCnt; i++) {
                data.m_pDelvRegion.push(TaskStructs.readTaskRegion(stream));
            }
        }

        // 5. m_pEnterRegion
        if (data.m_ulEnterRegionCnt > 0) {
            data.m_pEnterRegion = [];
            for (let i = 0; i < data.m_ulEnterRegionCnt; i++) {
                data.m_pEnterRegion.push(TaskStructs.readTaskRegion(stream));
            }
        }

        // 6. m_pLeaveRegion
        if (data.m_ulLeaveRegionCnt > 0) {
            data.m_pLeaveRegion = [];
            for (let i = 0; i < data.m_ulLeaveRegionCnt; i++) {
                data.m_pLeaveRegion.push(TaskStructs.readTaskRegion(stream));
            }
        }

        // 7. m_PremItems
        if (data.m_ulPremItems > 0) {
            data.m_PremItems = [];
            for (let i = 0; i < data.m_ulPremItems; i++) {
                data.m_PremItems.push(TaskStructs.readItemWanted(stream));
            }
        }

        // 8. m_GivenItems
        if (data.m_ulGivenItems > 0) {
            data.m_GivenItems = [];
            data.m_ulGivenCmnCount = 0;
            data.m_ulGivenTskCount = 0;
            for (let i = 0; i < data.m_ulGivenItems; i++) {
                const item = TaskStructs.readItemWanted(stream);
                data.m_GivenItems.push(item);
                if (item.m_bCommonItem) {
                    data.m_ulGivenCmnCount++;
                } else {
                    data.m_ulGivenTskCount++;
                }
            }
        }

        // 9. m_TeamMemsWanted
        if (data.m_bTeamwork && data.m_ulTeamMemsWanted > 0) {
            data.m_TeamMemsWanted = [];
            for (let i = 0; i < data.m_ulTeamMemsWanted; i++) {
                data.m_TeamMemsWanted.push(TaskStructs.readTeamMemWanted(stream));
            }
        }

        // 10. m_PremTitles
        if (data.m_iPremTitleNumTotal > 0) {
            data.m_PremTitles = [];
            for (let i = 0; i < data.m_iPremTitleNumTotal; i++) {
                data.m_PremTitles.push(stream.readInt32());
            }
        }

        // 11. m_MonsterWanted
        if (data.m_ulMonsterWanted > 0) {
            data.m_MonsterWanted = [];
            for (let i = 0; i < data.m_ulMonsterWanted; i++) {
                data.m_MonsterWanted.push(TaskStructs.readMonsterWanted(stream));
            }
        }

        // 12. m_PlayerWanted
        if (data.m_ulPlayerWanted > 0) {
            data.m_PlayerWanted = [];
            for (let i = 0; i < data.m_ulPlayerWanted; i++) {
                data.m_PlayerWanted.push(TaskStructs.readPlayerWanted(stream));
            }
        }

        // 13. m_ItemsWanted
        if (data.m_ulItemsWanted > 0) {
            data.m_ItemsWanted = [];
            for (let i = 0; i < data.m_ulItemsWanted; i++) {
                data.m_ItemsWanted.push(TaskStructs.readItemWanted(stream));
            }
        }

        // 14. m_pszExp / m_pExpArr
        if (data.m_ulExpCnt > 0) {
            data.m_pszExp = [];
            data.m_pExpArr = [];
            for (let i = 0; i < data.m_ulExpCnt; i++) {
                // Читаем строку выражения (char[64])
                data.m_pszExp.push(stream.readBytes(64));
                // Читаем массив TASK_EXPRESSION[64]
                const expArray = [];
                for (let j = 0; j < 64; j++) {
                    expArray.push(TaskStructs.readTaskExpression(stream));
                }
                data.m_pExpArr.push(expArray);
            }
        }

        // 15. m_pTaskChar
        if (data.m_ulTaskCharCnt > 0) {
            data.m_pTaskChar = [];
            for (let i = 0; i < data.m_ulTaskCharCnt; i++) {
                // Читаем task_char[64] (128 байт - 64 символа по 2 байта)
                data.m_pTaskChar.push(stream.readWideString(64));
            }
        }

        // 16. m_pReachSite
        if (data.m_ulReachSiteCnt > 0) {
            data.m_pReachSite = [];
            for (let i = 0; i < data.m_ulReachSiteCnt; i++) {
                data.m_pReachSite.push(TaskStructs.readTaskRegion(stream));
            }
        }

        // 17. m_pLeaveSite
        if (data.m_ulLeaveSiteCnt > 0) {
            data.m_pLeaveSite = [];
            for (let i = 0; i < data.m_ulLeaveSiteCnt; i++) {
                data.m_pLeaveSite.push(TaskStructs.readTaskRegion(stream));
            }
        }


        // 18-19. Награды
        data.m_Award_S = AwardDataParser.load(stream, version);
        data.m_Award_F = AwardDataParser.load(stream, version);
        data.m_AwByRatio_S = AwardRatioScaleParser.load(stream, version);
        data.m_AwByRatio_F = AwardRatioScaleParser.load(stream, version);
        data.m_AwByItems_S = AwardItemsScaleParser.load(stream, version);
        data.m_AwByItems_F = AwardItemsScaleParser.load(stream, version);

        return data;
    }
}

module.exports = FixedDataParser;
