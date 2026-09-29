# tgs→emoji

Конвертер анимированных стикеров Telegram (`.tgs`) в **GIF / APNG / PNG** — целиком в браузере, без сервера. Файл никуда не загружается.

## Возможности

- Перетаскивание или выбор `.tgs` (и сырого Lottie `.json`), живое превью с прозрачностью
- Форматы: **GIF** (играет везде), **APNG** (гладкая полупрозрачность), **PNG** (статичный кадр на выбор)
- Настройки экспорта: размер 64/128/256/512 px, частота кадров 60/30/24/15 fps
- Интерфейс **RU / EN** (автоопределение + переключатель)
- Тяжёлая сборка GIF/APNG — в Web Worker, интерфейс не подвисает на телефоне
- Полностью клиентская статики: можно захостить где угодно

## Как это работает

`.tgs` — это gzip-нутый Lottie JSON. Браузер распаковывает его (`DecompressionStream`, фолбэк — pako), `lottie-web` отрисовывает кадры на canvas с прозрачностью, а сборку в GIF делает [gifenc](https://github.com/mattdesl/gifenc) (глобальная палитра по сэмплам кадров, 1-битная прозрачность), в APNG — [UPNG](https://github.com/photopea/UPNG.js). Рендер кадров — на main thread (lottie-web нужен DOM), энкодинг — в воркере.

## Разработка

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов + сборка в dist/
npm run preview    # локальный просмотр собранной статики
npm run make:demo  # перегенерировать public/demo.tgs и тестовые стикеры
```

## Деплой на Render (Docker)

В репозитории есть многоступенчатый `Dockerfile` (node:22-alpine → nginx:alpine):

1. Запушь репозиторий на GitHub.
2. На Render: **New → Web Service** → подключи репозиторий.
3. Runtime: **Docker** — остальные настройки Render определит сам (порт берётся из `PORT`, по умолчанию 10000).
4. Deploy. Всё.

nginx отдаёт статику с gzip, hashed-ассеты кэшируются на 30 дней, `try_files` настроен как SPA-fallback. Кэш на Render можно сбрасывать командой "Clear build cache & deploy".

Подойдёт и любой другой статик-хостинг (Cloudflare Pages, Vercel, GitHub Pages) — просто публикуй содержимое `dist/`.

## Структура

```
src/
  App.tsx                  — экран, состояние, оркестрация конвертации
  i18n.tsx                 — словари RU/EN + переключатель
  assets/demo-lottie.json  — демо-эмодзи (анимация в drop-зоне и «попробовать демо»)
  lib/
    tgs.ts                 — распаковка gzip, валидация, метаданные
    frames.ts              — отрисовка кадров lottie → RGBA (main thread)
    convert.ts             — оркестрация: рендер + воркер, прогресс
    encode.worker.ts       — GIF (gifenc) / APNG (UPNG) в Web Worker
    worker-protocol.ts     — типы сообщений воркера
  components/              — Dropzone, PreviewPlayer, SettingsPanel, ResultCard, LangSwitch
```
