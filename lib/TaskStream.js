const iconv = require('iconv-lite');

class TaskStream {
    constructor(buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }

    // --- Базовые типы ---

    readInt32() {
        const val = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return val;
    }

    readUInt32() {
        const val = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return val;
    }

    readInt16() {
        const val = this.buffer.readInt16LE(this.offset);
        this.offset += 2;
        return val;
    }

    readByte() {
        const val = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readSByte() {
        const val = this.buffer.readInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readFloat() {
        const val = this.buffer.readFloatLE(this.offset);
        this.offset += 4;
        return val;
    }

    readBoolean() {
        const val = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return val !== 0;
    }

    readBytes(length) {
        const val = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return val;
    }

    readUInt8() {
        const val = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readWideString(lengthInChars) {
        // Read UTF-16LE string
        const byteLength = lengthInChars * 2;
        const strBuffer = this.readBytes(byteLength);
        let str = strBuffer.toString('utf16le');
        // Trim null terminators
        const nullIndex = str.indexOf('\0');
        if (nullIndex !== -1) {
            str = str.substring(0, nullIndex);
        }
        return str;
    }

    seek(offset) {
        this.offset = offset;
    }

    align(boundary) {
        const remainder = this.offset % boundary;
        if (remainder !== 0) {
            this.offset += boundary - remainder;
        }
    }

    getPosition() {
        return this.offset;
    }

    // --- Специфичное для Perfect World ---

    readTaskChar(length, key) {
        // Основано на JQEditor Extensions.ReadTaskChar
        // length - количество байт (обычно 60 символов * 2 байта = 120 байт)

        const data = this.readBytes(length);
        if (length % 2 !== 0 || !data) return null;

        let decipheredString = "";
        const keyBuffer = Buffer.alloc(2);
        keyBuffer.writeInt16LE(key, 0); // Логика конвертации ключа в 2 байта

        // В C#: byte[] keyB = BitConverter.GetBytes((short)key);
        // data[ofs + i] ^ keyB[i % 2]

        // Мы накапливаем байты и декодируем в конце или посимвольно?
        // C# декодирует посимвольно: Encoding.Unicode.GetChars(...)

        let resultBuffer = Buffer.alloc(length);

        for (let i = 0; i < length; i++) {
            // keyB index logic: i % 2.
            // data[i] ^ keyB[i % 2]
            resultBuffer[i] = data[i] ^ keyBuffer[i % 2];
        }

        // Теперь конвертируем в строку (UTF-16LE)
        // Обрезаем нули
        const rawString = resultBuffer.toString('utf16le');
        // Находим первый нулевой символ для обрезки, аналогично логике C#
        // "if (w != (char)0x00) DecypheredString += w; else break;"

        const nullIndex = rawString.indexOf('\0');
        if (nullIndex !== -1) {
            return rawString.substring(0, nullIndex);
        }
        return rawString;
    }

    // Для декодирования разговоров
    readBytesCustom(length) {
        return this.readBytes(length);
    }
}

module.exports = TaskStream;
