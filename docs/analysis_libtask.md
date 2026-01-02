# Финальный анализ папки libtask ✅

## Полная структура файла tasks.data

Папка `libtask` содержит **всё необходимое** для понимания формата файла tasks.data.

### 📦 Структура файла tasks.data

```
┌─────────────────────────────────────┐
│ TASK_PACK_HEADER (12 байт)         │
│  - magic: 0x93BB1DA1               │
│  - version: версия формата          │
│  - item_count: количество задач     │
├─────────────────────────────────────┤
│ Таблица оффсетов                    │
│  int[item_count] (4 байта каждый)  │
├─────────────────────────────────────┤
│ Задача 1 (по оффсету pOffs[0])    │
│  └─ ATaskTemplFixedData (0x420)    │
│  └─ Динамические данные             │
│  └─ Награды (AWARD_DATA)            │
│  └─ Диалоги (talk_proc)             │
│  └─ Подзадачи (рекурсивно)          │
├─────────────────────────────────────┤
│ Задача 2 (по оффсету pOffs[1])    │
│ ...                                 │
└─────────────────────────────────────┘
```

## Файлы в libtask

### 🔑 Ключевые компоненты

#### Глобальная загрузка
- ✅ `TASK_PACK_HEADER` - структура заголовка файла (12 байт)
- ✅ `LoadTasksFromPackForTimeTool` - главная функция загрузки всего файла

#### Загрузка одной задачи
- ✅ `LoadFromBinFile` - точка входа для загрузки задачи
- ✅ `LoadFixedDataFromBinFile` - фиксированная часть (0x420 байт)
- ✅ `structATaskTemplFixedData` - определение структуры

#### Награды (Awards)
- ✅ `LoadAwardDataBin` - основная загрузка наград
- ✅ `LoadAwardCandBin` - кандидаты наград
- ✅ `LoadAwardMonstersBin` - призываемые монстры
- ✅ `LoadAwardPQRankingBin` - награды за рейтинг PQ
- ✅ `LoadAwardDataItemsScale` - масштабирование по предметам
- ✅ `LoadAwardDataRatioScale` - масштабирование по коэффициентам

#### Диалоги (Conversations)
- ✅ `talk_proc_load` - загрузка процесса диалога
- ✅ `talk_proc_window_load` - загрузка окна диалога
- ✅ `convert_talk_text` - конвертация текста

#### Описания
- ✅ `LoadDescriptionBin` - описание задачи
- ✅ `LoadTributeBin` - атрибуты
- ✅ `CheckMask` - проверка масок

## Процесс чтения tasks.data

```c
1. LoadTasksFromPackForTimeTool(fp)
   │
   ├─ fread(TASK_PACK_HEADER, 12, 1, fp)
   │   └─ Проверка magic: 0x93BB1DA1
   │
   ├─ fread(pOffs[], 4, item_count, fp) 
   │   └─ Таблица оффсетов
   │
   └─ for (i = 0; i < item_count; i++)
       │
       ├─ fseek(fp, pOffs[i], 0)
       │
       └─ LoadFromBinFile(task, fp)
           │
           └─ LoadBinary(task, fp)
               │
               ├─ LoadFixedDataFromBinFile(fp)
               │   ├─ fread(struct, 0x420, 1, fp)
               │   ├─ Динамические массивы
               │   ├─ LoadAwardDataBin × 2
               │   └─ LoadAward...Scale × 4
               │
               ├─ LoadDescriptionBin(fp)
               ├─ LoadTributeBin(fp)
               ├─ talk_proc::load × 5
               │
               └─ for (подзадачи)
                   └─ LoadBinary (рекурсия)
```
