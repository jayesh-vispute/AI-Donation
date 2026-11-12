from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from app.db_models import ItemCondition

# --- Health / Generic ---
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    detections: Optional[List[Any]] = []
    items: Optional[List[Any]] = []

# --- AI Prediction ---
class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: Optional[float] = None

class DetectedItem(BaseModel):
    name: Optional[str] = None
    detected_class: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    confidence: float
    quantity: int
    condition: Optional[str] = "GOOD"
    requires_review: Optional[bool] = False
    bbox: Optional[BoundingBox] = None
    boxes: Optional[List[BoundingBox]] = []

class PredictionSummary(BaseModel):
    total_items: int

class PredictionResponse(BaseModel):
    success: bool = True
    status: Optional[str] = "success"
    message: Optional[str] = None
    image_analyzed: Optional[bool] = True
    image_id: Optional[int] = None
    image_url: Optional[str] = None
    detections: Optional[List[dict]] = []
    items: List[DetectedItem]
    summary: PredictionSummary
# --- Auth ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str

class NGORegister(UserCreate):
    organization_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    registration_number: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    display_name: str
    uid: str
    photo_url: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class AdminCreateUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str
    status: str = "Active"
    
    # NGO specific fields
    organization_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    registration_number: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Donor Profile ---
class DonorProfileBase(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    donor_type: Optional[str] = "Individual"
    notification_preferences: Optional[str] = None

class DonorProfileUpdate(DonorProfileBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class DonorProfileResponse(DonorProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- NGO Profile ---
class NGOProfileBase(BaseModel):
    organization_name: str
    registration_number: Optional[str] = None
    description: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    website: Optional[str] = None
    organization_type: Optional[str] = None
    logo_url: Optional[str] = None
    registration_certificate_url: Optional[str] = None
    pan_card_url: Optional[str] = None
    address_proof_url: Optional[str] = None

class NGOProfileCreate(NGOProfileBase):
    pass

class NGOProfileUpdate(NGOProfileBase):
    organization_name: Optional[str] = None
    email: Optional[str] = None

class NGOProfileResponse(NGOProfileBase):
    id: int
    user_id: int
    verification_status: str
    account_status: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Demands ---
class DemandItemCreate(BaseModel):
    category: Optional[str] = None
    item_name: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: Optional[int] = None
    quantity_required: Optional[int] = None
    priority: Optional[str] = "MEDIUM"
    notes: Optional[str] = None
    description: Optional[str] = None

class DemandBase(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    category_id: Optional[int] = None
    quantity_required: Optional[int] = None
    priority: str = "MEDIUM"
    expiry_date: Optional[datetime] = None
    required_date: Optional[datetime] = None
    description: Optional[str] = None

class DemandCreate(DemandBase):
    items: Optional[List[DemandItemCreate]] = None
    general_notes: Optional[str] = None

class DemandUpdate(BaseModel):
    quantity_required: Optional[int] = None
    priority: Optional[str] = None
    expiry_date: Optional[datetime] = None
    required_date: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[str] = None

class DemandResponse(DemandBase):
    id: int
    ngo_id: int
    group_id: Optional[str] = None
    quantity_fulfilled: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Cart ---
class CartItemBase(BaseModel):
    item_name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: int
    image_url: Optional[str] = None
    detection_id: Optional[int] = None

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: Optional[int] = None

class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Donations ---
class DonationItemBase(BaseModel):
    id: Optional[int] = None
    item_name: str
    category_id: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: int
    condition: Optional[str] = None
    confidence: Optional[float] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    detection_source: Optional[str] = None
    description: Optional[str] = None
    ai_detection_id: Optional[int] = None

class DonationItemCreate(BaseModel):
    category_id: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    item_name: str
    quantity: int = Field(default=1, ge=1)
    condition: Optional[str] = None
    confidence: Optional[float] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    detection_source: Optional[str] = None
    description: Optional[str] = None
    ai_detection_id: Optional[int] = None

class DonationCreate(BaseModel):
    ngo_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    pickup_address: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_postal_code: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_scheduled_at: Optional[datetime] = None
    delivery_address: Optional[str] = None
    donation_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[DonationItemBase]

class DonationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    items: Optional[List[DonationItemBase]] = None

class ItemAllocationInfo(BaseModel):
    allocation_id: Optional[int] = None
    id: Optional[int] = None
    ngo_id: int
    ngo_name: Optional[str] = None
    allocated_quantity: int
    status: str

    class Config:
        from_attributes = True

class DonationItemResponse(DonationItemBase):
    id: int
    donation_id: int
    allocated_quantity: Optional[int] = 0
    matching_status: Optional[str] = "PENDING"
    allocations: Optional[List[ItemAllocationInfo]] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DonationResponse(BaseModel):
    id: int
    donor_id: int
    ngo_id: Optional[int] = None
    ngo_name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: str
    pickup_address: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_postal_code: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_scheduled_at: Optional[datetime] = None
    delivery_address: Optional[str] = None
    donation_date: Optional[datetime] = None
    notes: Optional[str] = None
    delivery_proof_url: Optional[str] = None
    delivery_verified_by: Optional[str] = None
    delivery_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[DonationItemResponse]
    pickup: Optional["PickupResponse"] = None

    class Config:
        from_attributes = True

# --- Status History ---
class DonationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    remarks: Optional[str] = None

class DonationStatusHistoryResponse(BaseModel):
    id: int
    donation_id: int
    old_status: Optional[str]
    new_status: str
    changed_by_id: Optional[int]
    notes: Optional[str]
    remarks: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Matches ---
class MatchDemandProfile(DemandResponse):
    ngo: Optional[NGOProfileResponse] = None

    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    id: int
    donation_item_id: int
    demand_id: int
    matched_quantity: int
    item_similarity_score: Optional[float] = None
    similarity_score: Optional[float] = None
    quantity_score: Optional[float] = None
    proximity_score: Optional[float] = None
    priority_score: Optional[float] = None
    overall_score: float
    distance_km: Optional[float] = None
    match_reason: Optional[str] = None
    status: str
    
    # Recommendation details
    donation_id: Optional[int] = None
    ngo_id: Optional[int] = None
    ngo_name: Optional[str] = None
    demand_id: int
    matched_item: Optional[str] = None
    requested_quantity: Optional[int] = None
    match_score: Optional[float] = None
    match_status: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    remaining_demand: Optional[int] = None

    created_at: datetime
    updated_at: datetime
    demand: Optional[MatchDemandProfile] = None
    donation_item: Optional[DonationItemResponse] = None

    class Config:
        from_attributes = True

# --- Item-Level Matching & Allocation ---

class ItemMatchNGO(BaseModel):
    match_id: int
    ngo_id: int
    ngo_name: Optional[str] = None
    demand_id: int
    requested_quantity: int
    matched_quantity: int
    overall_score: float
    match_reason: Optional[str] = None
    distance_km: Optional[float] = None
    status: str

class ItemMatchDetail(BaseModel):
    item_id: int
    item_name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    donated_quantity: int
    allocated_quantity: int
    remaining_quantity: int
    matching_status: Optional[str] = None
    confidence: Optional[float] = None
    allocations: List[ItemAllocationInfo] = []
    matches: List[ItemMatchNGO] = []

class ItemAllocationRequest(BaseModel):
    ngo_id: int
    allocated_quantity: int
    match_id: Optional[int] = None

class ItemAllocationResponse(BaseModel):
    success: bool
    message: str
    item_id: int
    donated_quantity: int
    allocated_quantity: int
    remaining_quantity: int
    matching_status: str

class DonationItemMatchesResponse(BaseModel):
    donation_id: int
    donation_title: Optional[str] = None
    donation_status: str
    total_items: int
    fully_matched_items: int
    partially_matched_items: int
    unmatched_items: int
    items: List[ItemMatchDetail] = []

# --- Inventory ---
class InventoryBase(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    item_name: str
    subcategory: Optional[str] = None
    quantity: int = 0
    available_quantity: int = 0
    used_quantity: int = 0
    condition: Optional[str] = None
    status: Optional[str] = "AVAILABLE"
    received_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    item_name: Optional[str] = None
    subcategory: Optional[str] = None
    quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    used_quantity: Optional[int] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    received_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None

class InventoryResponse(InventoryBase):
    id: int
    ngo_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ImportSummary(BaseModel):
    total_rows: int
    success_count: int
    skipped_count: int
    duplicate_count: int
    errors: List[dict]

class InventoryStats(BaseModel):
    total_items: int
    ready_to_distribute: int
    allocated: int
    needs_attention: int

# --- Notifications ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    recipient_role: Optional[str] = None
    donation_id: Optional[int] = None
    ngo_id: Optional[int] = None
    donor_id: Optional[int] = None
    match_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    module: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Detections ---
class AIDetectionResponse(BaseModel):
    id: int
    donation_id: Optional[int] = None
    image_path: Optional[str] = None
    detected_class: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    confidence: float
    quantity: int
    bbox: Optional[str] = None
    status: Optional[str] = None
    condition: Optional[str] = None
    model_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboards ---
class DonorDashboardResponse(BaseModel):
    total_donations: int
    total_items: int
    completed_donations: int
    pending_donations: int
    active_donations: int
    ngos_reached: int
    recent_donations: List[DonationResponse]
    pending_pickups: int
    unread_notifications: int

    class Config:
        from_attributes = True

class NGODashboardResponse(BaseModel):
    incoming_donations: int
    pending_requests: int
    open_demands: int
    inventory_summary: List[InventoryResponse]
    urgent_needs: List[DemandResponse]

    class Config:
        from_attributes = True

class AdminDashboardResponse(BaseModel):
    total_users: int
    total_donors: int
    total_ngos: int
    pending_ngo_approvals: int
    total_donations: int
    completed_donations: int
    pending_donations: int
    active_matches: int = 0
    active_requests: int = 0
    ai_statistics: dict
    system_health: dict

    class Config:
        from_attributes = True


class MonthlyData(BaseModel):
    month: str
    donations: int
    items: int

class CategoryDistribution(BaseModel):
    name: str
    value: int

class MonthlyBreakdown(BaseModel):
    month: str
    donations: int
    itemsReceived: int
    fulfilledNeeds: int
    impact: int

class ActivityItem(BaseModel):
    id: int
    type: str
    title: str
    subtitle: str
    date: str
    icon: Optional[str] = None

class NGOAnalyticsResponse(BaseModel):
    totalDonationsReceived: int
    totalItemsReceived: int
    activeNeeds: int
    fulfilledNeeds: int
    monthlyData: List[MonthlyData]
    itemCategoryDistribution: List[CategoryDistribution]
    monthlyBreakdown: List[MonthlyBreakdown]
    recentActivity: List[ActivityItem]

    class Config:
        from_attributes = True

# --- Integration Models ---

class DonationRequestResponse(BaseModel):
    id: int
    donation_id: int
    ngo_id: int
    donor_id: int
    match_id: Optional[int] = None
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Flattened properties for the frontend
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    ngo_name: Optional[str] = None
    delivery_proof_url: Optional[str] = None
    delivery_verified_by: Optional[str] = None
    delivery_verified_at: Optional[datetime] = None
    delivery_otp_verified: Optional[bool] = None
    created_at: datetime
    match_score: Optional[float] = None
    items: List[DonationItemResponse] = []
    pickup_scheduled_at: Optional[datetime] = None
    pickup_address: Optional[str] = None
    pickup: Optional["PickupResponse"] = None
    
    class Config:
        from_attributes = True

class ReceiptItemCreate(BaseModel):
    donation_item_id: int
    expected_quantity: int
    received_quantity: int
    condition: ItemCondition

class ReceiptCreate(BaseModel):
    items: List[ReceiptItemCreate]
    notes: Optional[str] = None

class NGOSchedulePickupRequest(BaseModel):
    date: datetime
    time_slot: str
    volunteer: Optional[str] = None
    notes: Optional[str] = None

class PickupBase(BaseModel):
    date: datetime
    time_slot: Optional[str] = None
    address: Optional[str] = None
    volunteer: Optional[str] = None
    notes: Optional[str] = None

class PickupCreate(PickupBase):
    pass

class PickupUpdate(BaseModel):
    date: Optional[datetime] = None
    time_slot: Optional[str] = None
    address: Optional[str] = None
    volunteer: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class PickupResponse(PickupBase):
    id: int
    donation_id: int
    donor_id: int
    ngo_id: Optional[int] = None
    status: str
    items: Optional[List[DonationItemResponse]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



class DonationTrackingEventResponse(BaseModel):
    id: int
    donation_id: int
    status: str
    message: Optional[str] = None
    created_at: Optional[datetime] = None
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True

# --- NGO Donor List Models ---
class NGODonorStatsResponse(BaseModel):
    total_donors: int
    individuals: int
    organizations: int
    total_donations: int
    
class NGODonorResponse(UserResponse):
    donor_type: Optional[str] = "Individual"
    location: Optional[str] = "Not available"
    total_donations: Optional[int] = 0
    total_items: Optional[int] = 0
    last_donation: Optional[datetime] = None
    status: Optional[str] = "Active"

    class Config:
        from_attributes = True

class NGODonorDetailDonation(BaseModel):
    id: int
    title: Optional[str] = None
    donation_date: datetime
    status: str
    items_count: int
    matched_items_count: int

    class Config:
        from_attributes = True

class NGODonorDetailResponse(NGODonorResponse):
    donations: List[NGODonorDetailDonation]

# --- Packaging Checklist ---
class PackagingChecklistItemUpdate(BaseModel):
    is_completed: bool

class PackagingChecklistItemResponse(BaseModel):
    id: int
    item_instruction: str
    is_required: bool
    is_completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PackagingChecklistResponse(BaseModel):
    id: int
    donation_id: int
    status: str
    items: List[PackagingChecklistItemResponse] = []

    class Config:
        from_attributes = True
