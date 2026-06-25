# 88 sim

Красивый веб-интерфейс для просмотра фильмов и сериалов.

## Структура проекта

```
HdRezkaApi-main/
├── HdRezkaApi/          # Библиотека для работы с HDRezka
├── frontend/            # Фронтенд
│   ├── css/
│   ├── js/
│   └── index.html
├── app.py              # Flask приложение
├── Procfile            # Для Railway
├── requirements.txt    # Зависимости
└── .gitignore
```

## Деплой на Railway

1. Создай репозиторий на GitHub
2. Загрузи туда этот проект
3. Подключи репозиторий к Railway
4. Railway автоматически деплойнет проект!

## Локальный запуск

```bash
pip install -r requirements.txt
python app.py
```

Открой http://localhost:5000
