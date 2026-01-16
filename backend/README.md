# AMU Monitoring - Backend

Django backend for the AMU Monitoring capstone project.

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL 12+

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with the following variables:

```
# Database Configuration
DB_NAME=amu_monitoring_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

5. Create the PostgreSQL database:

```sql
CREATE DATABASE amu_monitoring_db;
```

6. Run migrations (when ready to initialize tables):

```bash
python manage.py makemigrations
python manage.py migrate
```

7. Create a superuser (optional):

```bash
python manage.py createsuperuser
```

8. Run the development server:

```bash
python manage.py runserver
```

## Project Structure

- `amu_monitoring/` - Main Django project directory
  - `settings.py` - Project settings including PostgreSQL configuration
  - `urls.py` - URL routing configuration
  - `wsgi.py` - WSGI configuration for deployment
  - `asgi.py` - ASGI configuration for async support
- `manage.py` - Django management script

## Notes

- The database is configured for PostgreSQL but tables are not initialized yet as per project requirements.
- CORS is enabled for frontend communication on localhost:3000.
