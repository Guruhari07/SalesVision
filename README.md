# SalesVision

SalesVision is a full-stack sales analytics platform that helps businesses turn raw sales data into meaningful insights. Instead of manually cleaning spreadsheets and calculating metrics, users can upload their sales data in different formats and instantly explore dashboards, analytics, forecasts, and AI-generated business insights.

The goal of this project was to build an end-to-end business intelligence application that combines data processing, visualization, machine learning, and a modern user interface into a single platform.

---

## Features

### Upload Sales Data

SalesVision accepts multiple file formats, including:

- CSV
- Excel (.xlsx / .xls)
- JSON
- XML
- PDF
- TXT
- ZIP archives

The application automatically detects the uploaded file type and processes it using the appropriate parser.

---

### Smart Column Mapping

Datasets from different sources often use different column names.

SalesVision automatically maps similar fields such as:

- Revenue → Sales
- Amount → Sales
- Order_Date → Order Date
- Profit_Value → Profit

This removes the need to manually edit files before uploading them.

---

### Interactive Dashboard

Once the data is processed, the dashboard displays important business metrics, including:

- Total Revenue
- Total Profit
- Total Orders
- Revenue by Region
- Revenue by Category
- Monthly Sales Trends
- Top Performing Products

Interactive charts are built using Recharts, making it easy to explore the uploaded data.

---

### Business Analytics

The platform calculates useful business metrics such as:

- Profit Margin
- Average Order Value (AOV)
- Customer Lifetime Value (CLV)
- Best and Worst Performing Regions
- Category Performance

These metrics help users understand overall business performance without needing external tools.

---

### Sales Forecasting

SalesVision uses a Linear Regression model from Scikit-learn to estimate future sales based on historical data.

The forecasting module provides:

- Predicted next month's revenue
- Trend visualization
- 95% confidence interval

---

### AI Insights

After analyzing the uploaded dataset, the application automatically generates business insights.

Examples include:

- Revenue growth trends
- High-performing categories
- Underperforming regions
- Profitability observations
- General recommendations

These insights are intended to help users quickly understand what is happening in their business data.

---

### Export Reports

Users can export processed data and reports in multiple formats:

- Excel
- CSV
- PDF

---

### Authentication

The application includes a secure authentication system using JWT.

Features include:

- User Registration
- Login
- Protected API routes

---

### Dark Mode

The interface supports both light and dark themes for a better user experience.

---

# Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Framer Motion
- Axios

## Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Scikit-learn
- PyMuPDF
- openpyxl
- lxml
- python-jose (JWT)

---

# Project Structure

```
SalesVision
│
├── client
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── utils
│   │   └── assets
│   └── package.json
│
├── server
│   └── app
│       ├── routers
│       ├── services
│       │   └── parsers
│       ├── models
│       ├── schemas
│       ├── core
│       └── main.py
│
└── README.md
```

---

# Getting Started

## Clone the repository

```bash
git clone https://github.com/yourusername/SalesVision.git

cd SalesVision
```

---

## Frontend

```bash
cd client

npm install

npm run dev
```

The frontend will start on:

```
http://localhost:5173
```

---

## Backend

Create a virtual environment:

```bash
cd server

python -m venv venv
```

Activate the virtual environment.

**Windows**

```bash
venv\Scripts\activate
```

**macOS / Linux**

```bash
source venv/bin/activate
```

Install the required packages.

```bash
pip install -r requirements.txt
```

Run the backend server.

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```
http://localhost:8000
```

---

# How It Works

1. Upload a sales dataset.
2. The system identifies the file format.
3. Data is cleaned and standardized.
4. Similar column names are mapped automatically.
5. Processed data is stored in the database.
6. Analytics and KPIs are calculated.
7. Machine learning predicts future sales.
8. AI generates business insights.
9. Results are displayed on the dashboard and can be exported.

---

# Future Improvements

Some features I would like to add in the future include:

- PostgreSQL support
- Multi-user workspaces
- AI chatbot for business queries
- Scheduled report generation
- Email notifications
- Role-based access control
- Cloud storage integration
- More advanced forecasting models

---

# Screenshots

You can add screenshots of:

- Landing Page
- Dashboard
- Analytics
- Forecast
- Reports

---

# Why I Built This

I created SalesVision to learn how different technologies can work together in a real-world business application. Instead of building a simple dashboard, I wanted to explore the complete workflow—from file parsing and backend processing to machine learning, authentication, and interactive data visualization.

This project helped me gain practical experience with full-stack development while solving a problem that many businesses face: making sense of raw sales data quickly and efficiently.

---

# Author

**Guruhari N**

GitHub: https://github.com/Guruhari07

LinkedIn: https://www.linkedin.com/in/guruhari-496w

---

If you found this project useful, feel free to ⭐ the repository.
