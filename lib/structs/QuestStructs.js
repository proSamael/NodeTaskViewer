/**
 * Вспомогательные функции для чтения структур квестов
 * На основе IDA: ITEM_WANTED, TEAM_MEM_WANTED, MONSTER_WANTED, PLAYER_WANTED
 */

class QuestStructs {
    /**
     * Читает требуемый предмет
     * На основе IDA: struct ITEM_WANTED, sizeof=0x11 (17 байт, packed)
     */
    static readItemWanted(stream) {
        return {
            m_ulItemTemplId: stream.readUInt32(),
            m_bCommonItem: stream.readUInt8(),
            m_ulItemNum: stream.readUInt32(),
            m_fProb: stream.readFloat(),
            m_lPeriod: stream.readInt32()
        };
    }

    /**
     * Читает требования к члену команды
     * На основе IDA: struct TEAM_MEM_WANTED, sizeof=0x24 (36 байт)
     */
    static readTeamMemWanted(stream) {
        return {
            m_ulLevelMin: stream.readUInt32(),
            m_ulLevelMax: stream.readUInt32(),
            m_ulRace: stream.readUInt32(),
            m_ulOccupation: stream.readUInt32(),
            m_ulGender: stream.readUInt32(),
            m_ulMinCount: stream.readUInt32(),
            m_ulMaxCount: stream.readUInt32(),
            m_ulTask: stream.readUInt32(),
            m_iForce: stream.readInt32()
        };
    }

    /**
     * Читает требуемого монстра
     * На основе IDA: struct MONSTER_WANTED, sizeof=0x1E (30 байт, packed, aligned(2))
     */
    static readMonsterWanted(stream) {
        return {
            m_ulMonsterTemplId: stream.readUInt32(),
            m_ulMonsterNum: stream.readUInt32(),
            m_ulDropItemId: stream.readUInt32(),
            m_ulDropItemCount: stream.readUInt32(),
            m_bDropCmnItem: stream.readUInt8(),
            m_fDropProb: stream.readFloat(),
            m_bKillerLev: stream.readUInt8(),
            m_iDPH: stream.readInt32(),
            m_iDPS: stream.readInt32()
        };
    }

    /**
     * Читает требуемого игрока
     * На основе IDA: struct PLAYER_WANTED, sizeof=0x25 (37 байт, packed)
     */
    static readPlayerWanted(stream) {
        return {
            m_ulPlayerNum: stream.readUInt32(),
            m_ulDropItemId: stream.readUInt32(),
            m_ulDropItemCount: stream.readUInt32(),
            m_bDropCmnItem: stream.readUInt8(),
            m_fDropProb: stream.readFloat(),
            m_Requirements: {
                m_ulOccupations: stream.readUInt32(),
                m_iMinLevel: stream.readInt32(),
                m_iMaxLevel: stream.readInt32(),
                m_iGender: stream.readInt32(),
                m_iForce: stream.readInt32()
            }
        };
    }
}

module.exports = QuestStructs;
