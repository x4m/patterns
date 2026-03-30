# Russian Forest Patterns

Генераторы бесконечных непериодических паттернов на тему «русский лес».  
Каждый файл — самодостаточный HTML, работает прямо в браузере без сервера.

## Открыть онлайн


| Генератор | Мотив |
|-----------|-------|
| [Берёза](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/birch-generator.html) | Лентикели на коре |
| [Сосна](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/pine.html) | Ветки с иголками |
| [Земляника](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/strawberry.html) | Листья и ягоды |
| [Крапива](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/nettle.html) | Листья и стебли |
| [Малина](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/raspberry.html) | Листья и ягоды |
| [Камни](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/stones.html) | Вороной |
| [Реки](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/river.html) | Меандрирующие потоки |
| [Дороги](https://htmlpreview.github.io/?https://github.com/x4m/patterns/blob/main/road.html) | Лесные тропы, вид сверху |


## Возможности

- **Бесконечны** — перетаскивайте мышью в любую сторону
- **Непериодичны** — паттерн никогда не повторяется точно
- **Детерминированы** — один seed всегда даёт одинаковый результат
- **Экспорт** — кнопка «Сохранить PNG» отдаёт файл 2560×1440

## Архитектура

`pattern-lib.js` — общая библиотека: PRNG [Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c), детерминированный хеш, canvas-взаимодействие (pan / zoom / touch), экспорт PNG, стили UI.

Алгоритмы генерации:

| Тип | Файлы | Метод |
|-----|-------|-------|
| Колонки | берёза, сосна | Вертикальные полосы + hash(column, row) |
| Scatter | земляника, крапива, малина | 2D ячейки + hash(i, j) |
| Вороной | камни | Worley noise, отсечение Сазерленда–Ходжмана |
| Линейные | реки, дороги | Сумма синусоид (меандр) |
