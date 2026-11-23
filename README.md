# Real Estate Landing Generator

Генератор статических лендингов для объектов недвижимости. Создаёт полностью самодостаточную HTML-страницу на основе JSON-конфигов — без фреймворков, без Node.js на сервере.

## Возможности

- **Полностью статический HTML** — работает на любом хостинге без Node.js
- **JSON-конфигурация** — весь контент и настройки в двух JSON-файлах
- **6 управляемых секций** — hero, property, gallery, complex, location, agent
- **3 темы оформления** — light premium, dark, minimal (переключение через JSON)
- **Галерея с лайтбоксом** — полноэкранный просмотр, клавиатура, мобильная адаптация
- **SEO** — title, description, canonical, Open Graph, JSON-LD (Schema.org), sitemap.xml, robots.txt
- **Яндекс Метрика** — подключение и отслеживание событий через конфигурацию
- **CRM-форма** — интерфейс отправки заявок на внешний backend endpoint
- **PHOTO-MANIFEST.md** — автоматический чек-лист фотографий с проверкой существования
- **Валидация** — проверка JSON-схем, путей к файлам, типов и допустимых значений
- **Минификация CSS** — CSS встроен в HTML; JavaScript встраивается как есть
- **Несколько лендингов** — каталог конфигурации выбирается флагом `--config`
- **Тесты** — автоматическая проверка сборки и передачи CRM endpoint
- **Доступность** — skip-link, aria-атрибуты, prefers-reduced-motion, фокус-стили
- **Производительность** — lazy loading, width/height изображений, отсутствие layout shift

## Требования

- **Node.js** >= 18 (для сборки, не нужен на production-сервере)
- **npm**

## Быстрый старт

```bash
# 1. Установить зависимости (пока не требуются — генератор на чистом Node.js)
npm install

# 2. Проверить конфигурацию
npm run validate

# 3. Собрать лендинг
npm run build

# 4. Предпросмотр в браузере
npm run preview
# → http://localhost:3000
```

## Структура проекта

```
real-estate-generator/
├── config/
│   ├── property.json          ← Данные объекта недвижимости
│   ├── landing.json           ← Настройки лендинга (тема, секции, SEO, аналитика)
│   ├── property.schema.json   ← JSON Schema для property.json
│   └── landing.schema.json    ← JSON Schema для landing.json
├── public/
│   ├── images/
│   │   ├── property/          ← Фотографии объекта
│   │   └── complex/           ← Фотографии жилого комплекса
│   └── favicon.ico
├── src/
│   ├── generator/             ← Генератор сборки
│   │   ├── build.js
│   │   ├── manifest.js
│   │   ├── preview.js
│   │   ├── clean.js
│   │   ├── utils.js
│   │   └── jsonld.js
│   ├── validator/             ← Валидация JSON и изображений
│   │   ├── validate.js
│   │   └── validate-cli.js
│   ├── sections/              ← HTML-рендереры секций
│   │   ├── hero.js
│   │   ├── property.js
│   │   ├── gallery.js
│   │   ├── complex.js
│   │   ├── location.js
│   │   ├── agent.js
│   ├── templates/
│   │   └── landing.html       ← HTML-шаблон
│   ├── styles/
│   │   ├── base.css           ← Базовые стили, reset, layout
│   │   ├── themes/
│   │   │   ├── light.css      ← Light Premium (молочный + графит + бежевые акценты)
│   │   │   ├── dark.css       ← Тёмная тема
│   │   │   └── minimal.css    ← Минималистичная тема
│   │   └── sections/          ← Стили секций
│   └── scripts/
│       ├── main.js            ← Навигация, CRM-форма, прокрутка
│       ├── gallery.js         ← Лайтбокс
│       └── analytics.js       ← События Яндекс Метрики
├── tests/
│   └── build.test.js          ← Автотесты сборщика
├── dist/                      ← Результат сборки (генерируется)
│   ├── index.html
│   ├── images/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── PHOTO-MANIFEST.md
├── package.json
├── README.md
└── .gitignore
```

## Как изменить информацию об объекте

Откройте `config/property.json`. Все данные объекта — в одном файле:

```json
{
  "property": {
    "type": "apartment",
    "title": "3-комнатная квартира в ЖК «Сказка Град»",
    "price": 8500000,
    "currency": "RUB",
    "rooms": 3,
    "area": 85,
    "floor": 12,
    "totalFloors": 25,
    "address": "Краснодар, ул. им. Мачуги В.Н., 166/2",
    "description": "Просторная квартира...",
    "features": ["Закрытая территория", "Охрана"],
    "characteristics": {}
  },
  "agent": {
    "name": "Имя Фамилия",
    "phone": "+79001234567",
    "whatsapp": "+79001234567",
    "telegram": "username",
    "description": "Опыт работы..."
  },
  "complex": {
    "name": "ЖК «Название»",
    "developer": "Девелопер",
    "description": "Описание комплекса",
    "features": ["Паркинг", "Школа", "Детский сад"]
  },
  "images": {
    "property": [{ "file": "property/main.webp", "alt": "Гостиная" }],
    "complex": [{ "file": "complex/building.webp", "alt": "Фасад" }]
  }
}
```

### Типы недвижимости

| `property.type` | JSON-LD Schema.org | Особенности |
|-----------------|--------------------|-------------|
| `apartment`     | Apartment          | Показывает этажность, комнаты, площадь |
| `house`         | House              | Пропускает этажность |
| `commercial`    | CommercialProperty | Скрывает комнаты |
| `land`          | Landform           | Только площадь и адрес |

### Неприменимые характеристики

Если характеристика не нужна — укажите `null` или удалите поле. Секция `property` автоматически скрывает пустые поля. Например:

```json
{
  "price": null,
  "area": null,
  "floor": null,
  "totalFloors": null
}
```

Эти поля не появятся на странице.

### Характеристики (гибкие)

В `property.characteristics` можно добавить любые пары ключ-значение — они отобразятся карточками:

```json
"characteristics": {
  "Ремонт": "Дизайнерский",
  "Санузел": "2 раздельных",
  "Балкон": "2 лоджии",
  "Парковка": "Подземная"
}
```

## Как выбрать тему

В `config/landing.json` измените поле `theme`:

```json
{ "theme": "dark" }
```

Доступные темы: `light` (по умолчанию), `dark`, `minimal`.

## Как включить/отключить секции

В `config/landing.json` секция `sections` управляет порядком и видимостью:

```json
{
  "sections": [
    { "id": "hero",      "enabled": true },
    { "id": "property",  "enabled": true },
    { "id": "gallery",   "enabled": true },
    { "id": "complex",   "enabled": true },
    { "id": "location",  "enabled": true },
    { "id": "agent",     "enabled": true }
  ]
}
```

Порядок в массиве = порядок на странице. Секции с `enabled: false` не попадают в HTML.

### Если нет данных для секции

Если данные отсутствуют (например, нет `complex`), секция автоматически не отобразится — пустых блоков не будет.

## Как подключить Яндекс Метрику

В `config/landing.json`:

```json
{
  "analytics": {
    "yandexMetrika": {
      "enabled": true,
      "counterId": "12345678"
    }
  }
}
```

**Важно:** если `enabled: false` или `counterId` пустой/`null` — код Метрики не попадёт в HTML.

Отслеживаемые события:
- `page_view` — просмотр страницы
- `phone_click` — клик по телефону
- `whatsapp_click` — клик по WhatsApp
- `telegram_click` — клик по Telegram
- `form_start` — начало заполнения формы
- `form_submit` — успешная отправка формы
- `gallery_open` — открытие лайтбокса
- `anchor_click` — клик по якорной ссылке в навигации

## Как подключить CRM

В `config/landing.json`:

```json
{
  "crm": {
    "enabled": true,
    "provider": "custom",
    "endpoint": "https://your-backend.com/api/leads"
  }
}
```

**Важно:**

- Форма не появится, если `endpoint` пустой или `enabled: false`
- Генератор **не отправляет** данные — только рендерит форму
- На бэкенде должен быть endpoint, принимающий `POST` с JSON `{ name, phone, comment }`
- **Не размещайте** API-ключи и секреты в HTML/JS — вся авторизация на бэкенде
- Форма имеет валидацию, защиту от повторной отправки, состояния загрузки и ошибок

## Как добавить фотографии

1. Положите файлы в `public/images/property/` и `public/images/complex/`
2. Отформатируйте в **WebP** (рекомендуется) — `cwebp input.jpg -o output.webp -q 80`
3. Добавьте записи в `config/property.json` → `images`

```json
"images": {
  "property": [
    { "file": "property/main.webp", "alt": "Гостиная квартиры" },
    { "file": "property/kitchen.webp", "alt": "Кухня" }
  ],
  "complex": [
    { "file": "complex/building.webp", "alt": "Фасад здания" }
  ]
}
```

После сборки `npm run build` создаст `dist/PHOTO-MANIFEST.md` с чек-листом всех фотографий и статусом существования.

### Лимиты

Настроить минимум/максимум можно в `config/landing.json`:

```json
{
  "images": {
    "property": { "minCount": 5, "maxCount": 10 },
    "complex":  { "minCount": 2, "maxCount": 5 }
  }
}
```

Валидатор (`npm run validate`) проверит соответствие.

## Команды

| Команда | Описание |
|---------|----------|
| `npm run validate` | Проверка JSON-конфигов и фотографий |
| `npm run validate -- --config=config/<dir>` | Проверка другого каталога конфигурации |
| `npm run build` | Сборка в `dist/` |
| `npm run build -- --config=config/<dir>` | Сборка из другого каталога конфигурации |
| `npm run build -- --config=config/<dir> --out=build/<dir>` | Сборка из другого каталога в другую папку |
| `npm run preview` | Локальный сервер для просмотра `dist/` |
| `npm run clean` | Удаление папки `dist/` |
| `npm test` | Автоматические тесты сборщика |

По умолчанию используется каталог `config/` и выход `dist/` — обратная совместимость сохранена.

> **PowerShell:** если аргументы после `--` не передаются (особенность шима `npm.ps1`),
> используйте `npm.cmd run build -- --config=config/<dir>` или `cmd /c "npm run build -- --config=config/<dir>"`.

### Сборка из другого каталога конфигурации

Каталог конфигурации — это папка с файлами `property.json` и `landing.json`.
Он передаётся флагом `--config`:

```bash
npm run validate -- --config=config/my-landing
npm run build -- --config=config/my-landing
```

Фотографии при этом берутся из общего `public/images/`.

## Публикация

### Статический хостинг (Netlify, Vercel, GitHub Pages)

После `npm run build` содержимое папки `dist/` готово к загрузке на любой статический хостинг.

### VPS (nginx)

1. Соберите лендинг: `npm run build`
2. Скопируйте `dist/*` на сервер: `scp -r dist/* user@server:/var/www/landing/`
3. Настройте nginx:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Кеширование статики
    location ~* \.(webp|jpg|png|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Проверка перед публикацией

1. `npm run validate` — конфиги и фото
2. `npm run build` — сборка
3. `npm run preview` → откройте http://localhost:3000
4. Проверьте в DevTools:
   - **Lighthouse** (Performance, SEO, Accessibility)
   - Консоль — нет ошибок JS
   - Все ссылки и кнопки работают
   - Мобильная версия (переключите на мобильный viewport)
   - Фиксированная нижняя панель на мобильных

## Пример: новый лендинг для дома

Лендинг полностью определяется каталогом конфигурации. Создайте отдельный каталог:

1. **Создайте папку** `config/my-landing/`
2. **Скопируйте** в неё `config/property.json` и `config/landing.json`
3. **Измените** `config/my-landing/property.json`:

```json
{
  "property": {
    "type": "house",
    "title": "Загородный дом 180 м²",
    "price": 15000000,
    "currency": "RUB",
    "area": 180,
    "address": "Краснодарский край, пос. ..."
  },
  "agent": {
    "name": "Имя Риэлтора",
    "phone": "+79xxxxxxxxx"
  },
  "complex": null,
  "images": {
    "property": [
      { "file": "property/exterior.webp", "alt": "Фасад дома" }
    ]
  }
}
```

4. **Измените** `config/my-landing/landing.json` — отключите ненужные секции (например, `complex` и `location`)
5. **Проверьте и соберите** через CLI:

```bash
npm run validate -- --config=config/my-landing
npm run build -- --config=config/my-landing
```

Результат появится в `dist/`. Чтобы собрать несколько лендингов рядом, укажите отдельные папки:

```bash
npm run build -- --config=config/my-landing --out=build/my-landing
npm run build -- --config=config/sakazka-grad --out=build/sakazka-grad
```

Для полной изоляции создайте отдельную папку проекта — генератор не содержит жёстко зашитых данных объекта.

## Тесты

```bash
npm test
```

Проверяются:

- передача CRM endpoint с `https://` и `http://` в клиентский код без искажений;
- сборка с альтернативным каталогом конфигурации;
- ошибка сборки при отсутствии обязательного JS-файла;
- ошибка сборки при отсутствии обязательного CSS-файла.

## Безопасность

- Все динамические значения экранируются (`escapeHtml`)
- Пути к изображениям проверяются на выход за пределы `public/images/`
- Расширения файлов проверяются (`.webp`, `.jpg`, `.png`, `.gif`, `.avif`)
- API-ключи и секреты **не размещаются** в коде — только на бэкенде
- `eval` и `innerHTML` с непроверенными данными не используются

## Производительность

- CSS минифицирован и встроен в HTML; JavaScript встроен без минификации (осознанно: самописная минификация на регулярных выражениях портит строки с URL)
- Изображения: `loading="lazy"`, `decoding="async"`, `width`/`height`
- Главное изображение hero: `fetchpriority="high"` (рекомендуется задать при добавлении)
- Нет внешних шрифтов (используется системный стек)
- Нет layout shift: фиксированные размеры, `aspect-ratio`
- `prefers-reduced-motion` учтён
