/**
 * Загрузка структуры talk_proc (разговоры/диалоги)
 * Основано на libtask/talk_proc_load и talk_proc_window_load
 */
class LoadTalkProc {
    static load(stream, taskCode) {
        const data = {};

        data.id_talk = stream.readInt32(); // ID диалога
        // C++: fread(text, 0x80, 1, fp); convert_txt(text, 64, code);
        // text занимает 128 байт = 64 wchar символа, зашифровано XOR
        // Это, вероятно, заголовок или внутреннее имя диалога
        data.text = stream.readTaskChar(128, taskCode);
        data.num_window = stream.readInt32(); // Количество окон (слайдов) диалога

        // Проверка на разумность: num_window не должно быть слишком большим
        if (data.num_window < 0 || data.num_window > 100) {
            throw new Error(`Invalid num_window=${data.num_window} at position ${stream.getPosition() - 4}. Likely parsing error.`);
        }

        data.windows = [];
        for (let i = 0; i < data.num_window; i++) {
            const window = {
                id: stream.readInt32(),          // ID окна
                id_parent: stream.readInt32(),   // ID родительского окна
                talk_text_len: stream.readInt32() // Длина текста в окне
            };

            // Проверка на разумность длины текста
            if (window.talk_text_len < 0 || window.talk_text_len > 10000) {
                throw new Error(`Invalid talk_text_len=${window.talk_text_len} at position ${stream.getPosition() - 4}. Likely parsing error.`);
            }

            // C++: fread(talk_text, 2, talk_text_len, fp); convert_txt(talk_text, talk_text_len, code);
            // Чтение текста диалога с XOR дешифровкой
            window.talk_text = stream.readTaskChar(window.talk_text_len * 2, taskCode);

            // Чтение опций (вариантов ответа)
            window.num_option = stream.readInt32();

            // Проверка на разумность количества опций
            if (window.num_option < 0 || window.num_option > 100) {
                throw new Error(`Invalid num_option=${window.num_option} at position ${stream.getPosition() - 4}. Likely parsing error.`);
            }
            window.options = [];
            for (let j = 0; j < window.num_option; j++) {
                // Структура talk_proc_option занимает фиксированные 136 байт (0x88)
                // Содержит текст опции (128 байт) + ID следующего диалога + параметр
                const optionData = stream.readBytes(136);
                // Примечание: options[j].text (первые 128 байт) также требует convert_txt
                // Пока читаем как сырые байты, можно расшифровать позже при необходимости отображения
                window.options.push(optionData);
            }

            data.windows.push(window);
        }

        // Примечание: здесь в оригинале происходила конвертация кодировки текста (convert_talk_text)

        return data;
    }
}

module.exports = LoadTalkProc;
