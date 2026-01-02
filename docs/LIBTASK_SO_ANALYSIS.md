# Детальный анализ libtask.so.c

Этот документ содержит глубокий анализ декомпилированного кода `libtask.so.c`, фокусируясь на механизмах загрузки данных задач.

## 1. Обзор архитектуры

Квестовая система Perfect World базируется на классе `ATaskTempl`, который содержит логику выполнения квеста, и `ATaskTemplFixedData`, содержащем статические данные (требования, награды, тексты). Менеджер `ATaskTemplMan` управляет коллекцией этих шаблонов.

## 2. Иерархия загрузки (Call Graph)

Весь процесс загрузки одной задачи инициируется функцией `ATaskTempl::LoadFromBinFile`, которая вызывает `ATaskTempl::LoadBinary`.

**ATaskTempl::LoadBinary** (Основная функция) последовательно вызывает:

1.  **ATaskTemplFixedData::LoadFixedDataFromBinFile**
    *   Загрузка основных свойств, требований (Items, Monsters) и наград (Awards).
    *   Это самый большой блок данных.

2.  **ATaskTempl::LoadDescriptionBin**
    *   Загрузка текстового описания квеста.

3.  **ATaskTempl::LoadTributeBin**
    *   Загрузка информации о дани (Tribute).

4.  **Загрузка диалогов (Talks)**
    *   `m_DelvTaskTalk` (Диалог при сдаче квеста)
    *   `m_UnqualifiedTalk` (Диалог при несоответствии условий)
    *   `m_DelvItemTalk` (Диалог при наличии предметов для сдачи)
    *   `m_ExeTalk` (Диалог во время выполнения)
    *   `m_AwardTalk` (Диалог при выдаче награды)

5.  **Рекурсивная загрузка подзадач (Sub-tasks)**
    *   Считывается число подзадач: `m_nSubCount`.
    *   Запускается цикл от 0 до `m_nSubCount`.
    *   Внутри цикла создается новый объект `ATaskTempl`.
    *   Для нового объекта вызывается **ATaskTempl::LoadBinary()** (рекурсия).
    *   Таким образом, данные подквестов физически находятся внутри блока родительской задачи.

---

## 3. Процесс загрузки: ATaskTemplFixedData::LoadFixedDataFromBinFile

Эта функция вызывается первой внутри `LoadBinary` и отвечает за десериализацию основной части данных квеста.

### Предварительная очистка
Перед чтением функция освобождает память для динамических массивов (если они были заняты).

### 1. Основной блок данных (Base Data)
`fread(this, 0x420u, 1u, fp);`
Считывается структура `ATaskTemplFixedData` целиком (1056 байт для v105+). Это включает в себя все простые поля (`int`, `bool`, `float`) и заголовки для динамических массивов.

### 2. Подпись (Signature)
`if (this->m_bHasSign)`
*   Читается `m_pszSignature`: массив `task_char` длиной 30 (60 байт).

### 3. Расписание (Timetable)
`if (this->m_ulTimetable)`
*   Цикл `i < m_ulTimetable`: `fread` `m_tmStart`, `m_tmEnd` (по 24 байта).

### 4. Ключи изменений (Change Keys)
`if (this->m_ulChangeKeyCnt)`
*   Цикл: `fread` Key (4b), Value (4b), Type (1b).

### 5. PQ Expressions (Public Quest)
`if (this->m_ulPQExpCnt)`
*   Цикл: `fread` строка (64b), `fread` данные (512b).

### 6. Вклад монстров (Monster Contribution)
`if (this->m_ulMonsterContribCnt)`
*   Цикл: `fread` (16 байт).

### 7. Регионы (Regions)
1.  **Delivery**: `m_ulDelvRegionCnt` * 24 байта.
2.  **Enter**: `m_ulEnterRegionCnt` * 24 байта.
3.  **Leave**: `m_ulLeaveRegionCnt` * 24 байта.

### 8. Требуемые предметы (Premise Items)
`if (this->m_ulPremItems)`
*   Цикл: `fread` (17 байт: ID + count + flags).

### 9. Выдаваемые предметы (Given Items)
`if (this->m_ulGivenItems)`
*   Цикл: `fread` (17 байт).

### 10. Командная работа (Teamwork)
`if (this->m_bTeamwork && this->m_ulTeamMemsWanted)`
*   Цикл: `fread` (36 байт).

### 11. Ограничение по титулам (Premise Titles)
`if (this->m_iPremTitleNumTotal)` (Обратите внимание: используется Total, а не Required)
*   Цикл: `fread` (4 байта).

### 12. Охота на монстров (Monster Wanted)
`if (this->m_ulMonsterWanted)`
*   Цикл: `fread` (30 байт).

### 13. Рекрутинг игроков (Player Wanted)
`if (this->m_ulPlayerWanted)`
*   Цикл: `fread` (37 байт).

### 14. Сбор предметов (Items Wanted)
`if (this->m_ulItemsWanted)`
*   Цикл: `fread` (17 байт).

### 15. Выражения (Expressions)
`if (this->m_ulExpCnt)`
*   Цикл: `fread` строка (64b), `fread` данные (512b).

### 16. Символы задач (Task Char)
`if (this->m_ulTaskCharCnt)`
*   Цикл: `fread` (128 байт).

### 17. Точки достижения/покидания (Reach/Leave Site)
1.  `m_ulReachSiteCnt` * 24 байта.
2.  `m_ulLeaveSiteCnt` * 24 байта.

### 18. Награды (Awards)
Вызываются функции загрузки наград для веток "Успех" (S) и "Провал" (F):
*   `LoadAwardDataBin` (Success/Failure)
*   `LoadAwardDataRatioScale` (Success/Failure)
*   `LoadAwardDataItemsScale` (Success/Failure)

---

## 4. Завершение загрузки (ATaskTempl::LoadBinary)

После того как `LoadedFixedData` отработала (вернув управление в `LoadBinary`), продолжается чтение:

1.  **Descriptions**: `LoadDescriptionBin` читает описание квеста (строки).
2.  **Tribute**: `LoadTributeBin`.
3.  **Dialogs**: `talk_proc::load` читает диалоги NPC.
    *   Структура диалога обычно включает количество окон, текст каждого окна, варианты ответов.
4.  **Sub-tasks (Подквесты)**:
    *   `fread(&this->m_nSubCount, 4u, 1u, fp);` - Читается количество подквестов.
    *   В цикле для каждого подквеста рекурсивно вызывается `ATaskTempl::LoadBinary(v3, fp)`.
    *   Это означает, что **данные подквестов идут СРАЗУ** за данными родительского квеста, вложенно.

## 5. Выводы для парсинга (JavaScript)

Структура файла `tasks.data` является **иерархической**, а не линейной.
1.  Читаем заголовок файла.
2.  Читаем таблицу смещений КОРНЕВЫХ (top-level) задач.
3.  Переходим по смещению.
4.  Запускаем рекурсивный парсер `TaskTempl.load()`:
    *   Читаем Fixed Data (1056 байт + динамические массивы).
    *   Читаем описания и диалоги.
    *   Читаем `sub_count`.
    *   Если `sub_count > 0`, **рекурсивно** вызываем `TaskTempl.load()` внутри текущей позиции потока.
