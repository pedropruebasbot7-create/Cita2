# Umbra Beauty Studio

Sistema completo de citas, servicios y tienda para un salón de belleza.

## Requisitos
- Python 3.11+
- pip

## Instalación local
```bash
pip install -r requirements.txt
python app.py
```

La app se abre en http://localhost:5000

## Despliegue en Render
1. Subir este repositorio a GitHub.
2. Crear un Web Service en Render usando este repo.
3. Seleccionar Python.
4. Comando de inicio: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Añadir la variable de entorno `SECRET_KEY` si quieres reemplazar la clave por defecto.

## Archivos importantes
- `app.py`: aplicación Flask
- `templates/`: vistas HTML
- `static/`: CSS, JS y archivos subidos
- `instance/beauty.db`: base de datos SQLite
