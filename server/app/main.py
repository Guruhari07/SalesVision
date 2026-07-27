import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.database import engine, Base
from app.routers import auth, upload, dashboard, analytics, prediction, insights, reports, users

# Create all database tables on startup if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database creation warning: {str(e)}")

app = FastAPI(
    title="SalesVision AI API",
    description="Backend services for SalesVision AI dashboard",
    version="1.0.0"
)

# 1. CORS Configuration
# Allow local Vite dev server and any deployed Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. IP-based Rate Limiting Middleware (Sliding Window, 120 requests per minute)
rate_limit_store = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only rate limit endpoints under /api
    if request.url.path.startswith("/api"):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        if client_ip not in rate_limit_store:
            rate_limit_store[client_ip] = []
            
        # Retain timestamps from the last 60 seconds
        rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if current_time - t < 60]
        
        # Check limit
        if len(rate_limit_store[client_ip]) >= 120:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Limit is 120 requests per minute."}
            )
            
        rate_limit_store[client_ip].append(current_time)
        
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Internal server error: {str(e)}"}
        )

# 3. Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "SalesVision AI API",
        "docs": "/docs"
    }
