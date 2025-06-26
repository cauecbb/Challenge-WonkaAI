# Invoice Processing Backend

This project implements the **backend** for an invoice processing system. It performs OCR extraction from scanned invoices (PDF/images), parses and stores the extracted data in a PostgreSQL database, and exposes REST API endpoints for integration with a prebuilt React frontend.

> **Note:** The frontend (in `/invoice-processing/`) was already mostly ready. This backend was built to integrate seamlessly with it and provide all necessary API and database functionality.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Main Endpoints](#main-endpoints)
- [Dependencies](#dependencies)
- [Notes & Troubleshooting](#notes--troubleshooting)
- [Contact](#contact)

---

## Project Overview
- **Backend:** FastAPI app for OCR extraction, data parsing, and database storage.
- **Frontend:** React app (already provided) for user interaction and visualization.
- **Database:** PostgreSQL running locally via Docker Compose.

The backend receives invoice files, extracts and parses their data, saves them in the database, and exposes endpoints for the frontend to consume.

---

## Prerequisites
- **Python 3.9+**
- **Node.js 18+** (for the frontend)
- **Docker** (for the database)
- **Tesseract OCR** installed on your system ([Download here](https://github.com/tesseract-ocr/tesseract))
- **pip** (Python package manager)

---

## Project Structure
```
/
├── backend/                # FastAPI backend, OCR, database integration
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── database.py
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── ...
├── invoice-processing/     # React frontend (already provided)
│   ├── package.json
│   ├── src/
│   └── ...
└── ...
```

---

## Database Setup

1. **Edit `backend/docker-compose.yml`**
   - Change the database name to your own, e.g.:
     ```yaml
     POSTGRES_DB: meetwonka_your_firstname_your_lastname
     ```

2. **Start the database:**
   ```sh
   cd backend
   docker-compose up -d
   ```
   The database will be available at `localhost:5435`.

3. **Database credentials:**
   - **Host:** `localhost`
   - **Port:** `5435`
   - **User:** `postgres`
   - **Password:** `password`
   - **Database:** `meetwonka_your_firstname_your_lastname`

---

## Running the Backend

1. **Install dependencies:**
   ```sh
   cd backend
   pip install -r requirements.txt
   ```

2. **Ensure Tesseract is installed and available in your PATH.**
   - [Tesseract download](https://github.com/tesseract-ocr/tesseract)

3. **Run the backend:**
   ```sh
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

---

## Running the Frontend

1. **Install dependencies:**
   ```sh
   cd invoice-processing
   npm install
   ```

2. **Run the frontend:**
   ```sh
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## Main Endpoints

- **POST `/extract-invoice`**
  - Upload a PDF/image invoice. The backend extracts, parses, saves, and returns the full invoice object.
- **GET `/invoices`**
  - Returns all invoices saved in the database, in the format expected by the frontend.
- **Swagger/OpenAPI docs:**
  - Available at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Dependencies

### Backend
- fastapi
- uvicorn
- pytesseract
- opencv-python
- pillow
- python-multipart
- SQLAlchemy
- psycopg2 (via SQLAlchemy/Postgres)
- Docker (for database)

### Frontend (see `invoice-processing/package.json`)
- React
- Chakra UI
- Vite
- Axios
- ...and more (see package.json)

---

## Notes & Troubleshooting
- The backend is designed to work out-of-the-box with the provided frontend.
- The OCR and regex logic is robust, but may need fine-tuning for new invoice layouts or poor scan quality.
- If you get a database connection error, check if Docker is running and the port matches your config.
- If you get a Tesseract error, ensure it is installed and available in your system PATH.
- Swagger docs are available at `/docs` for easy API testing.
- You can use DBeaver, pgAdmin, or psql to inspect the database.

---

## Contact
For questions or issues, open an issue in the repository or contact me.
contato.cauecbb@gmail.com
