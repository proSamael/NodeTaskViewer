/**
 * Вспомогательные функции для чтения базовых структур задач
 * Основано на IDA структурах из папки libtask
 */

class TaskStructs {
    /**
     * Читает структуру времени task_tm
     * IDA: struct task_tm, sizeof=0x18 (24 байта)
     */
    static readTaskTm(stream) {
        return {
            year: stream.readInt32(),   // 0x00
            month: stream.readInt32(),  // 0x04
            day: stream.readInt32(),    // 0x08
            hour: stream.readInt32(),   // 0x0C
            min: stream.readInt32(),    // 0x10
            wday: stream.readInt32()    // 0x14
        };
    }

    /**
     * Читает 3D координату (вершину зоны)
     * IDA: union ZONE_VERT, sizeof=0xC (12 байт)
     */
    static readZoneVert(stream) {
        return {
            x: stream.readFloat(),  // 0x00
            y: stream.readFloat(),  // 0x04
            z: stream.readFloat()   // 0x08
        };
    }

    /**
     * Читает выражение условия задачи
     * IDA: struct TASK_EXPRESSION, sizeof=0x8 (8 байт)
     */
    static readTaskExpression(stream) {
        return {
            type: stream.readInt32(),   // 0x00
            value: stream.readFloat()   // 0x04
        };
    }

    /**
     * Читает вклад монстров
     * IDA: struct MONSTERS_CONTRIB, sizeof=0x10 (16 байт)
     */
    static readMonstersContrib(stream) {
        return {
            m_ulMonsterTemplId: stream.readUInt32(),      // 0x00
            m_iWholeContrib: stream.readInt32(),          // 0x04
            m_iShareContrib: stream.readInt32(),          // 0x08
            m_iPersonalWholeContrib: stream.readInt32()   // 0x0C
        };
    }

    /**
     * Читает регион задачи
     * IDA: struct Task_Region, sizeof=0x18 (24 байта)
     */
    static readTaskRegion(stream) {
        return {
            zvMin: this.readZoneVert(stream),  // 0x00-0x0B (12 байт)
            zvMax: this.readZoneVert(stream)   // 0x0C-0x17 (12 байт)
        };
    }

    /**
     * Читает требуемый предмет
     * IDA: struct ITEM_WANTED, sizeof=0x11 (17 байт)
     */
    static readItemWanted(stream) {
        return {
            m_ulItemTemplId: stream.readUInt32(),   // 0x00
            m_bCommonItem: stream.readUInt8(),      // 0x04 (bool)
            m_ulItemNum: stream.readUInt32(),       // 0x05
            m_fProb: stream.readFloat(),            // 0x09
            m_lPeriod: stream.readInt32()           // 0x0D
        };
    }

    /**
     * Читает требования к убийству игрока
     * IDA: struct Kill_Player_Requirements, sizeof=0x14 (20 байт)
     */
    static readKillPlayerRequirements(stream) {
        return {
            m_ulOccupations: stream.readUInt32(),   // 0x00
            m_iMinLevel: stream.readInt32(),        // 0x04
            m_iMaxLevel: stream.readInt32(),        // 0x08
            m_iGender: stream.readInt32(),          // 0x0C
            m_iForce: stream.readInt32()            // 0x10
        };
    }

    /**
     * Читает требуемого игрока для убийства
     * IDA: struct PLAYER_WANTED, sizeof=0x25 (37 байт)
     */
    static readPlayerWanted(stream) {
        return {
            m_ulPlayerNum: stream.readUInt32(),          // 0x00
            m_ulDropItemId: stream.readUInt32(),         // 0x04
            m_ulDropItemCount: stream.readUInt32(),      // 0x08
            m_bDropCmnItem: stream.readUInt8(),          // 0x0C (bool)
            m_fDropProb: stream.readFloat(),             // 0x0D
            m_Requirements: this.readKillPlayerRequirements(stream)  // 0x11-0x24 (20 байт)
        };
    }

    /**
     * Читает требуемого монстра
     * IDA: struct MONSTER_WANTED, sizeof=0x1E (30 байт)
     */
    static readMonsterWanted(stream) {
        return {
            m_ulMonsterTemplId: stream.readUInt32(),     // 0x00
            m_ulMonsterNum: stream.readUInt32(),         // 0x04
            m_ulDropItemId: stream.readUInt32(),         // 0x08
            m_ulDropItemCount: stream.readUInt32(),      // 0x0C
            m_bDropCmnItem: stream.readUInt8(),          // 0x10 (bool)
            m_fDropProb: stream.readFloat(),             // 0x11
            m_bKillerLev: stream.readUInt8(),            // 0x15 (bool)
            m_iDPH: stream.readInt32(),                  // 0x16
            m_iDPS: stream.readInt32()                   // 0x1A
        };
    }

    /**
     * Читает требования к члену команды
     * IDA: struct TEAM_MEM_WANTED, sizeof=0x24 (36 байт)
     */
    static readTeamMemWanted(stream) {
        return {
            m_ulLevelMin: stream.readUInt32(),       // 0x00
            m_ulLevelMax: stream.readUInt32(),       // 0x04
            m_ulRace: stream.readUInt32(),           // 0x08
            m_ulOccupation: stream.readUInt32(),     // 0x0C
            m_ulGender: stream.readUInt32(),         // 0x10
            m_ulMinCount: stream.readUInt32(),       // 0x14
            m_ulMaxCount: stream.readUInt32(),       // 0x18
            m_ulTask: stream.readUInt32(),           // 0x1C
            m_iForce: stream.readInt32()             // 0x20
        };
    }
    /**
     * Читает COMPARE_KEY_VALUE (20 байт)
     * Предположительно 5 int32
     */
    static readCompareKeyValue(stream) {
        return {
            nExp1: stream.readInt32(),
            nExp2: stream.readInt32(),
            nExp3: stream.readInt32(),
            nExp4: stream.readInt32(),
            nExp5: stream.readInt32()
        };
    }
}

module.exports = TaskStructs;
