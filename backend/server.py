from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import aiofiles
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Equipment Loan Management API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= Models =============

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    model: str
    serial_number: Optional[str] = None
    status: str = "Available"  # Available, On Loan, Maintenance, Retired
    current_borrower: Optional[str] = None
    current_borrower_email: Optional[str] = None
    delivery_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EquipmentCreate(BaseModel):
    name: str
    model: str
    serial_number: Optional[str] = None
    status: str = "Available"

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None

class Movement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_id: str
    equipment_name: str
    movement_type: str  # check_out, check_in
    borrower_name: str
    borrower_email: str
    delivery_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    actual_return_date: Optional[datetime] = None
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovementCreate(BaseModel):
    equipment_id: str
    movement_type: str
    borrower_name: str
    borrower_email: str
    delivery_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    notes: Optional[str] = None

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_id: str
    movement_id: Optional[str] = None
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="system_settings")
    check_interval_hours: int = 1  # Default: check every hour
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    check_interval_hours: int

# ============= Equipment Endpoints =============

@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equipment: EquipmentCreate):
    equipment_dict = equipment.model_dump()
    equipment_obj = Equipment(**equipment_dict)
    
    doc = equipment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc.get('delivery_date'):
        doc['delivery_date'] = doc['delivery_date'].isoformat()
    if doc.get('expected_return_date'):
        doc['expected_return_date'] = doc['expected_return_date'].isoformat()
    
    await db.equipment.insert_one(doc)
    return equipment_obj

@api_router.get("/equipment", response_model=List[Equipment])
async def get_all_equipment(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = {}
    if status and status != "All":
        query['status'] = status
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'model': {'$regex': search, '$options': 'i'}},
            {'serial_number': {'$regex': search, '$options': 'i'}}
        ]
    
    equipment_list = await db.equipment.find(query, {"_id": 0}).to_list(1000)
    
    for equip in equipment_list:
        for date_field in ['created_at', 'updated_at', 'delivery_date', 'expected_return_date']:
            if equip.get(date_field) and isinstance(equip[date_field], str):
                equip[date_field] = datetime.fromisoformat(equip[date_field])
    
    return equipment_list

@api_router.get("/equipment/{equipment_id}", response_model=Equipment)
async def get_equipment(equipment_id: str):
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    for date_field in ['created_at', 'updated_at', 'delivery_date', 'expected_return_date']:
        if equipment.get(date_field) and isinstance(equipment[date_field], str):
            equipment[date_field] = datetime.fromisoformat(equipment[date_field])
    
    return equipment

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, equipment_update: EquipmentUpdate):
    existing = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = {k: v for k, v in equipment_update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    
    updated = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    for date_field in ['created_at', 'updated_at', 'delivery_date', 'expected_return_date']:
        if updated.get(date_field) and isinstance(updated[date_field], str):
            updated[date_field] = datetime.fromisoformat(updated[date_field])
    
    return updated

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str):
    result = await db.equipment.delete_one({"id": equipment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted successfully"}

# ============= Movement Endpoints =============

@api_router.post("/movements", response_model=Movement)
async def create_movement(movement: MovementCreate):
    # Get equipment details
    equipment = await db.equipment.find_one({"id": movement.equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    movement_dict = movement.model_dump()
    movement_dict['equipment_name'] = equipment['name']
    
    if movement.movement_type == "check_out":
        movement_dict['actual_return_date'] = None
    elif movement.movement_type == "check_in":
        movement_dict['actual_return_date'] = datetime.now(timezone.utc)
    
    movement_obj = Movement(**movement_dict)
    
    # Update equipment status
    if movement.movement_type == "check_out":
        await db.equipment.update_one(
            {"id": movement.equipment_id},
            {"$set": {
                "status": "On Loan",
                "current_borrower": movement.borrower_name,
                "current_borrower_email": movement.borrower_email,
                "delivery_date": movement.delivery_date.isoformat() if movement.delivery_date else None,
                "expected_return_date": movement.expected_return_date.isoformat() if movement.expected_return_date else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    elif movement.movement_type == "check_in":
        await db.equipment.update_one(
            {"id": movement.equipment_id},
            {"$set": {
                "status": "Available",
                "current_borrower": None,
                "current_borrower_email": None,
                "delivery_date": None,
                "expected_return_date": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    # Save movement
    doc = movement_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    if doc.get('delivery_date'):
        doc['delivery_date'] = doc['delivery_date'].isoformat()
    if doc.get('expected_return_date'):
        doc['expected_return_date'] = doc['expected_return_date'].isoformat()
    if doc.get('actual_return_date'):
        doc['actual_return_date'] = doc['actual_return_date'].isoformat()
    
    await db.movements.insert_one(doc)
    return movement_obj

@api_router.get("/movements", response_model=List[Movement])
async def get_all_movements(
    equipment_id: Optional[str] = Query(None),
    movement_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    query = {}
    if equipment_id:
        query['equipment_id'] = equipment_id
    if movement_type:
        query['movement_type'] = movement_type
    if start_date or end_date:
        query['timestamp'] = {}
        if start_date:
            query['timestamp']['$gte'] = start_date
        if end_date:
            query['timestamp']['$lte'] = end_date
    
    movements = await db.movements.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    for mov in movements:
        for date_field in ['timestamp', 'delivery_date', 'expected_return_date', 'actual_return_date']:
            if mov.get(date_field) and isinstance(mov[date_field], str):
                mov[date_field] = datetime.fromisoformat(mov[date_field])
    
    return movements

@api_router.get("/movements/overdue")
async def get_overdue_equipment():
    now = datetime.now(timezone.utc).isoformat()
    equipment_list = await db.equipment.find({
        "status": "On Loan",
        "expected_return_date": {"$lt": now}
    }, {"_id": 0}).to_list(1000)
    
    for equip in equipment_list:
        for date_field in ['created_at', 'updated_at', 'delivery_date', 'expected_return_date']:
            if equip.get(date_field) and isinstance(equip[date_field], str):
                equip[date_field] = datetime.fromisoformat(equip[date_field])
    
    return equipment_list

@api_router.get("/overdue/detailed")
async def get_overdue_detailed():
    """Get detailed overdue information with days calculation"""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    equipment_list = await db.equipment.find({
        "status": "On Loan",
        "expected_return_date": {"$lt": now_iso}
    }, {"_id": 0}).to_list(1000)
    
    overdue_details = []
    for equip in equipment_list:
        expected_return = datetime.fromisoformat(equip['expected_return_date']) if isinstance(equip['expected_return_date'], str) else equip['expected_return_date']
        days_overdue = (now - expected_return).days
        
        overdue_details.append({
            "id": equip['id'],
            "name": equip['name'],
            "model": equip['model'],
            "borrower_name": equip.get('current_borrower', 'N/A'),
            "borrower_email": equip.get('current_borrower_email', 'N/A'),
            "expected_return_date": expected_return.isoformat(),
            "days_overdue": days_overdue,
            "status": "Atrasado"
        })
    
    return overdue_details

# ============= Document Endpoints =============

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    equipment_id: str = Form(...),
    movement_id: Optional[str] = Form(None)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size (50MB max)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 50MB")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Create document record
    document = Document(
        equipment_id=equipment_id,
        movement_id=movement_id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(content)
    )
    
    doc = document.model_dump()
    doc['uploaded_at'] = doc['uploaded_at'].isoformat()
    
    await db.documents.insert_one(doc)
    
    return {
        "id": document.id,
        "filename": file.filename,
        "file_size": len(content),
        "uploaded_at": document.uploaded_at.isoformat()
    }

@api_router.get("/documents/equipment/{equipment_id}")
async def get_equipment_documents(equipment_id: str):
    documents = await db.documents.find({"equipment_id": equipment_id}, {"_id": 0}).to_list(1000)
    
    for doc in documents:
        if doc.get('uploaded_at') and isinstance(doc['uploaded_at'], str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    
    return documents

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    document = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document['file_path'])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=document['original_filename'],
        media_type='application/pdf'
    )

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    document = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    file_path = Path(document['file_path'])
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.documents.delete_one({"id": document_id})
    
    return {"message": "Document deleted successfully"}

# ============= Stats Endpoint =============

@api_router.get("/stats")
async def get_stats():
    total_equipment = await db.equipment.count_documents({})
    available = await db.equipment.count_documents({"status": "Available"})
    on_loan = await db.equipment.count_documents({"status": "On Loan"})
    maintenance = await db.equipment.count_documents({"status": "Maintenance"})
    
    now = datetime.now(timezone.utc).isoformat()
    overdue = await db.equipment.count_documents({
        "status": "On Loan",
        "expected_return_date": {"$lt": now}
    })
    
    return {
        "total_equipment": total_equipment,
        "available": available,
        "on_loan": on_loan,
        "maintenance": maintenance,
        "overdue": overdue
    }

# ============= Settings Endpoints =============

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = Settings()
        return default_settings.model_dump()
    
    if settings.get('updated_at') and isinstance(settings['updated_at'], str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

@api_router.put("/settings")
async def update_settings(settings_update: SettingsUpdate):
    settings = Settings(
        check_interval_hours=settings_update.check_interval_hours,
        updated_at=datetime.now(timezone.utc)
    )
    
    doc = settings.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.settings.update_one(
        {"id": "system_settings"},
        {"$set": doc},
        upsert=True
    )
    
    return {"message": "Settings updated successfully", "settings": settings.model_dump()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()