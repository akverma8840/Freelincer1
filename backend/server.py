from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    available: bool = True
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SiteSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str = "Gourmet Catering"
    hero_title: str = "Exquisite Catering Services"
    hero_description: str = "Creating unforgettable culinary experiences for your special events. From intimate gatherings to grand celebrations, we bring gourmet flavors to your table."
    menu_title: str = "Our Menu"
    menu_description: str = "Crafted with the finest ingredients and culinary expertise"
    about_title: str = "About Gourmet Catering"
    about_description: str = "With over 15 years of culinary excellence, we specialize in creating memorable dining experiences that perfectly complement your special occasions. Our team of expert chefs combines traditional techniques with modern flavors to deliver exceptional catering services."
    contact_phone1: str = "(555) 123-4567"
    contact_phone2: str = "(555) 987-6543"
    contact_email1: str = "info@gourmetcatering.com"
    contact_email2: str = "orders@gourmetcatering.com"
    contact_address1: str = "123 Culinary Street"
    contact_address2: str = "Foodie City, FC 12345"
    footer_text: str = "© 2024 Gourmet Catering. All rights reserved."
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SiteSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    hero_title: Optional[str] = None
    hero_description: Optional[str] = None
    menu_title: Optional[str] = None
    menu_description: Optional[str] = None
    about_title: Optional[str] = None
    about_description: Optional[str] = None
    contact_phone1: Optional[str] = None
    contact_phone2: Optional[str] = None
    contact_email1: Optional[str] = None
    contact_email2: Optional[str] = None
    contact_address1: Optional[str] = None
    contact_address2: Optional[str] = None
    footer_text: Optional[str] = None

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    available: bool = True
    image_url: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    available: Optional[bool] = None
    image_url: Optional[str] = None

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Initialize admin user and default site settings on startup
async def create_default_admin():
    admin_exists = await db.admin_users.find_one({"username": "admin"})
    if not admin_exists:
        hashed_password = get_password_hash("admin123")
        admin_user = AdminUser(username="admin", hashed_password=hashed_password)
        await db.admin_users.insert_one(admin_user.dict())
        print("Default admin user created: admin/admin123")

async def create_default_site_settings():
    settings_exists = await db.site_settings.find_one({})
    if not settings_exists:
        default_settings = SiteSettings()
        await db.site_settings.insert_one(default_settings.dict())
        print("Default site settings created")

# Public Routes
@api_router.get("/")
async def root():
    return {"message": "Catering Service API"}

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({"available": True}).to_list(1000)
    return [MenuItem(**item) for item in menu_items]

@api_router.get("/menu/categories")
async def get_categories():
    pipeline = [
        {"$match": {"available": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    categories = await db.menu_items.aggregate(pipeline).to_list(1000)
    return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]

@api_router.get("/site-settings", response_model=SiteSettings)
async def get_site_settings():
    settings = await db.site_settings.find_one({})
    if settings:
        return SiteSettings(**settings)
    else:
        # Return default settings if none exist
        default_settings = SiteSettings()
        await db.site_settings.insert_one(default_settings.dict())
        return default_settings

# Authentication Routes
@api_router.post("/auth/login", response_model=Token)
async def login(admin_data: AdminLogin):
    admin_user = await db.admin_users.find_one({"username": admin_data.username})
    if not admin_user or not verify_password(admin_data.password, admin_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin_user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Protected Admin Routes
@api_router.get("/admin/menu", response_model=List[MenuItem])
async def get_admin_menu(current_user: str = Depends(get_current_user)):
    menu_items = await db.menu_items.find().to_list(1000)
    return [MenuItem(**item) for item in menu_items]

@api_router.post("/admin/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, current_user: str = Depends(get_current_user)):
    menu_item = MenuItem(**item.dict())
    await db.menu_items.insert_one(menu_item.dict())
    return menu_item

@api_router.put("/admin/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item_update: MenuItemUpdate, current_user: str = Depends(get_current_user)):
    existing_item = await db.menu_items.find_one({"id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = {k: v for k, v in item_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    updated_item = await db.menu_items.find_one({"id": item_id})
    return MenuItem(**updated_item)

@api_router.delete("/admin/menu/{item_id}")
async def delete_menu_item(item_id: str, current_user: str = Depends(get_current_user)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

@api_router.get("/admin/site-settings", response_model=SiteSettings)
async def get_admin_site_settings(current_user: str = Depends(get_current_user)):
    settings = await db.site_settings.find_one({})
    if settings:
        return SiteSettings(**settings)
    else:
        # Return default settings if none exist
        default_settings = SiteSettings()
        await db.site_settings.insert_one(default_settings.dict())
        return default_settings

@api_router.put("/admin/site-settings", response_model=SiteSettings)
async def update_site_settings(settings_update: SiteSettingsUpdate, current_user: str = Depends(get_current_user)):
    existing_settings = await db.site_settings.find_one({})
    
    if not existing_settings:
        # Create default settings if none exist
        default_settings = SiteSettings()
        await db.site_settings.insert_one(default_settings.dict())
        existing_settings = default_settings.dict()
    
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.site_settings.update_one({}, {"$set": update_data})
    updated_settings = await db.site_settings.find_one({})
    return SiteSettings(**updated_settings)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await create_default_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()