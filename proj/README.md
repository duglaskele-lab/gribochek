# Грибочек / Mushroom Girl

Платформер на HTML5 canvas в одном файле: пять процедурно генерируемых уровней и пять боссов (лес, пустыня, болото, ледяная пещера, разрушенный город).

- **Играть:** открыть `dist/gribochek.html` в браузере (двойным щелчком, сервер не нужен).
- **Собрать после правок:** `python3 build.py`. Файлы из `src/` склеиваются в `dist/gribochek.html`.
- **Проверить:** `python3 tests/run.py --changed`, либо по имени: `python3 tests/run.py boss4`.
  Нужен `pip install playwright && playwright install chromium`.
- **Как всё устроено и как добавлять уровни, врагов и боссов:** [ARCHITECTURE.md](ARCHITECTURE.md).
