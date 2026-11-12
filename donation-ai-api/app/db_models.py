from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional
import enum
from app.database import Base

class RoleEnum(str, enum.Enum):
    DONOR = "DONOR"
    NGO = "NGO"
    ADMIN = "ADMIN"
    # Legacy
    donor = "donor"
    ngo = "ngo"
    admin = "admin"

class DonationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    MATCHED = "MATCHED"
    PACKAGING_NOTIFIED = "PACKAGING_NOTIFIED"
    PACKED = "PACKED"
    SEALED = "SEALED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKUP_CONFIRMED = "PICKUP_CONFIRMED"
    COLLECTED = "COLLECTED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    NGO_RECEIVED = "NGO_RECEIVED"
    RECEIVED = "RECEIVED"
    ACKNOWLEDGED = "ACKNOWLEDGED" # [DEPRECATED - DO NOT USE]
    DISTRIBUTED = "DISTRIBUTED" # [DEPRECATED - DO NOT USE]
    COMPLETED = "COMPLETED" # [DEPRECATED - DO NOT USE]
    CANCELLED = "CANCELLED"
    # Legacy
    matched = "matched"
    packaging_notified = "packaging_notified"
    packed = "packed"
    sealed = "sealed"
    pickup_scheduled = "pickup_scheduled"
    pickup_confirmed = "pickup_confirmed"
    collected = "collected"
    delivered = "delivered"
    acknowledged = "acknowledged" # [DEPRECATED - DO NOT USE]
    distributed = "distributed" # [DEPRECATED - DO NOT USE]
    completed = "completed" # [DEPRECATED - DO NOT USE]
    cancelled = "cancelled"

class DemandPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"
    # Legacy
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    # Legacy
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class DonationRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    MATCHED = "MATCHED"
    ACCEPTED = "ACCEPTED"
    PACKAGING_NOTIFIED = "PACKAGING_NOTIFIED"
    PACKED = "PACKED"
    SEALED = "SEALED"
    REJECTED = "REJECTED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKUP_CONFIRMED = "PICKUP_CONFIRMED"
    COLLECTED = "COLLECTED"
    DELIVERED = "DELIVERED"
    NGO_RECEIVED = "NGO_RECEIVED"
    RECEIVED = "RECEIVED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PickupStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    COLLECTED = "COLLECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class InventoryStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"

class DemandStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    # Legacy
    active = "active"
    partially_fulfilled = "partially_fulfilled"
    fulfilled = "fulfilled"
    expired = "expired"
    cancelled = "cancelled"

class MatchStatus(str, enum.Enum):
    active = "active"
    accepted = "accepted"
    rejected = "rejected"
    completed = "completed"

MatchStatus.ACTIVE = MatchStatus.active
MatchStatus.ACCEPTED = MatchStatus.accepted
MatchStatus.REJECTED = MatchStatus.rejected
MatchStatus.COMPLETED = MatchStatus.completed

class ItemCondition(str, enum.Enum):
    NEW = "NEW"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"

class AllocationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ngo_profile = relationship("NGOProfile", back_populates="user", uselist=False)
    donations = relationship("Donation", back_populates="donor")
    notifications = relationship("Notification", foreign_keys="[Notification.user_id]", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user")
    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False)

class DonorProfile(Base):
    __tablename__ = "donor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    donor_type = Column(String, default="Individual")
    notification_preferences = Column(String) # JSON or simple string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="donor_profile")


class NGOProfile(Base):
    __tablename__ = "ngo_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String, nullable=False)
    registration_number = Column(String, unique=True)
    description = Column(Text)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    city = Column(String, index=True)
    state = Column(String)
    postal_code = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    account_status = Column(Enum(AccountStatus), default=AccountStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    website = Column(String)
    organization_type = Column(String)
    logo_url = Column(String)
    registration_certificate_url = Column(String)
    pan_card_url = Column(String)
    address_proof_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('latitude >= -90 AND latitude <= 90', name='check_latitude'),
        CheckConstraint('longitude >= -180 AND longitude <= 180', name='check_longitude'),
    )

    user = relationship("User", back_populates="ngo_profile")
    demands = relationship("Demand", back_populates="ngo")
    inventory_items = relationship("Inventory", back_populates="ngo")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=True)
    title = Column(String)
    description = Column(Text)
    status = Column(Enum(DonationStatus), default=DonationStatus.PENDING)
    pickup_address = Column(String)
    pickup_city = Column(String)
    pickup_state = Column(String)
    pickup_postal_code = Column(String)
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    pickup_scheduled_at = Column(DateTime)
    delivery_address = Column(String)
    donation_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    delivery_proof_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('pickup_latitude >= -90 AND pickup_latitude <= 90', name='check_pickup_latitude'),
        CheckConstraint('pickup_longitude >= -180 AND pickup_longitude <= 180', name='check_pickup_longitude'),
    )

    donor = relationship("User", back_populates="donations")
    ngo = relationship("NGOProfile")
    items = relationship("DonationItem", back_populates="donation")
    ai_detections = relationship("AIDetection", back_populates="donation")
    status_history = relationship("DonationStatusHistory", back_populates="donation")
    pickups = relationship("Pickup", back_populates="donation", cascade="all, delete-orphan")
    packaging_checklist = relationship("PackagingChecklist", back_populates="donation", uselist=False)
    delivery_proofs = relationship("DeliveryProof", back_populates="donation")

    @property
    def pickup(self):
        return self.pickups[0] if self.pickups else None

    @property
    def ngo_name(self) -> Optional[str]:
        if self.ngo:
            return self.ngo.organization_name
        if self.items:
            for item in self.items:
                if item.allocations:
                    for alloc in item.allocations:
                        if alloc.ngo:
                            return alloc.ngo.organization_name
        return None

    @property
    def resolved_ngo_id(self) -> Optional[int]:
        if self.ngo_id:
            return self.ngo_id
        if self.items:
            for item in self.items:
                if item.allocations:
                    for alloc in item.allocations:
                        if alloc.ngo_id:
                            return alloc.ngo_id
        return None


class DonationItem(Base):
    __tablename__ = "donation_items"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    item_name = Column(String, nullable=False, index=True)
    category = Column(String, index=True) # Legacy string category
    subcategory = Column(String, index=True, nullable=True)
    quantity = Column(Integer, nullable=False)
    allocated_quantity = Column(Integer, default=0, nullable=False)
    matching_status = Column(String, default="PENDING")
    condition = Column(Enum(ItemCondition), nullable=True)
    confidence = Column(Float)
    unit = Column(String)
    image_url = Column(String)
    detection_source = Column(String)
    ai_detection_id = Column(Integer, ForeignKey("ai_detections.id"), nullable=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('quantity >= 1', name='check_item_quantity'),
        CheckConstraint('confidence >= 0 AND confidence <= 1', name='check_confidence'),
        CheckConstraint('allocated_quantity >= 0 AND allocated_quantity <= quantity', name='check_allocated_quantity_max'),
    )

    donation = relationship("Donation", back_populates="items")
    ai_detection = relationship("AIDetection")
    matches = relationship("Match", back_populates="donation_item")
    allocations = relationship("DonationItemAllocation", back_populates="donation_item")


class DonationItemAllocation(Base):
    __tablename__ = "donation_item_allocations"
    id = Column(Integer, primary_key=True, index=True)
    donation_item_id = Column(Integer, ForeignKey("donation_items.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=False)
    allocated_quantity = Column(Integer, nullable=False)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('donation_item_id', 'ngo_id', name='uq_item_ngo_allocation'),
        CheckConstraint('allocated_quantity >= 0', name='check_allocated_quantity_non_negative'),
    )

    donation_item = relationship("DonationItem", back_populates="allocations")
    ngo = relationship("NGOProfile")



class PackagingChecklist(Base):
    __tablename__ = "packaging_checklists"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False, unique=True)
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, PACKED, SEALED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    items = relationship("PackagingChecklistItem", back_populates="checklist", cascade="all, delete-orphan")
    donation = relationship("Donation", back_populates="packaging_checklist")


class PackagingChecklistItem(Base):
    __tablename__ = "packaging_checklist_items"
    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("packaging_checklists.id"), nullable=False)
    item_instruction = Column(String, nullable=False)
    is_required = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    checklist = relationship("PackagingChecklist", back_populates="items")


class DonationImage(Base):
    __tablename__ = "donation_images"
    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=True)
    image_url = Column(String, nullable=False)
    processing_status = Column(String, default="uploaded") # uploaded, processing, processed, failed
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    donor = relationship("User")
    donation = relationship("Donation")
    ai_detections = relationship("AIDetection", back_populates="image")


class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    detection_id = Column(Integer, ForeignKey("ai_detections.id"), nullable=True)
    item_name = Column(String, nullable=False, index=True)
    category = Column(String, index=True)
    subcategory = Column(String, index=True, nullable=True)
    quantity = Column(Integer, nullable=False)
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('quantity >= 1', name='check_cart_quantity'),
    )

    user = relationship("User", back_populates="cart_items")
    detection = relationship("AIDetection")


class Demand(Base):
    __tablename__ = "demands"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String, index=True, nullable=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    item_name = Column(String, nullable=False, index=True)
    category = Column(String, index=True) # Legacy
    subcategory = Column(String, index=True, nullable=True)
    quantity_required = Column(Integer, nullable=False)
    quantity_fulfilled = Column(Integer, default=0)
    priority = Column(Enum(DemandPriority), default=DemandPriority.MEDIUM)
    expiry_date = Column(DateTime, index=True)
    required_date = Column(DateTime)
    description = Column(Text)
    status = Column(Enum(DemandStatus), default=DemandStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('quantity_required >= 1', name='check_quantity_required'),
        CheckConstraint('quantity_fulfilled >= 0', name='check_quantity_fulfilled'),
    )

    ngo = relationship("NGOProfile", back_populates="demands")
    matches = relationship("Match", back_populates="demand")


class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    donation_item_id = Column(Integer, ForeignKey("donation_items.id"), nullable=False)
    demand_id = Column(Integer, ForeignKey("demands.id"), nullable=False)
    matched_quantity = Column(Integer, nullable=False)
    item_similarity_score = Column(Float)
    quantity_score = Column(Float)
    proximity_score = Column(Float)
    priority_score = Column(Float)
    overall_score = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=True)
    match_reason = Column(Text)
    status = Column(Enum(MatchStatus, values_callable=lambda x: [e.value for e in x]), default=MatchStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('donation_item_id', 'demand_id', name='uq_donation_item_demand_match'),
        CheckConstraint('matched_quantity >= 1', name='check_matched_quantity'),
        CheckConstraint('overall_score >= 0 AND overall_score <= 1', name='check_overall_score'),
    )

    donation_item = relationship("DonationItem", back_populates="matches")
    demand = relationship("Demand", back_populates="matches")

    @property
    def ngo_id(self) -> Optional[int]:
        return self.demand.ngo_id if self.demand else None

    @property
    def ngo_name(self) -> Optional[str]:
        if self.demand and self.demand.ngo:
            return self.demand.ngo.organization_name
        return None

    @property
    def matched_item(self) -> Optional[str]:
        if self.donation_item:
            return self.donation_item.item_name
        elif self.demand:
            return self.demand.item_name
        return None

    @property
    def category(self) -> Optional[str]:
        if self.donation_item and self.donation_item.category:
            return self.donation_item.category
        elif self.demand:
            return self.demand.category
        return None

    @property
    def subcategory(self) -> Optional[str]:
        if self.donation_item and self.donation_item.subcategory:
            return self.donation_item.subcategory
        elif self.demand:
            return self.demand.subcategory
        return None

    @property
    def remaining_demand(self) -> Optional[int]:
        if self.demand:
            return max(0, self.demand.quantity_required - self.demand.quantity_fulfilled)
        return None

    @property
    def similarity_score(self) -> Optional[float]:
        return self.item_similarity_score

    @property
    def donation_id(self) -> Optional[int]:
        return self.donation_item.donation_id if self.donation_item else None

    @property
    def requested_quantity(self) -> Optional[int]:
        return self.demand.quantity_required if self.demand else None

    @property
    def match_score(self) -> float:
        return self.overall_score

    @property
    def match_status(self) -> str:
        return self.status.value if self.status else "active"


class DonationStatusHistory(Base):
    __tablename__ = "donation_status_history"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    old_status = Column(String)
    new_status = Column(Enum(DonationStatus), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    donation = relationship("Donation", back_populates="status_history")
    changed_by = relationship("User")


class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=False)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category_name = Column(String)  # Support manual categories
    item_name = Column(String, nullable=False, index=True)
    subcategory = Column(String, index=True, nullable=True)
    quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    used_quantity = Column(Integer, default=0)
    condition = Column(Enum(ItemCondition), nullable=True)
    status = Column(Enum(InventoryStatus), default=InventoryStatus.AVAILABLE)
    received_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)
    storage_location = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ngo = relationship("NGOProfile", back_populates="inventory_items")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String)
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(Integer, nullable=True)
    recipient_role = Column(String, nullable=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=True)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    module = Column(String)
    entity_type = Column(String)
    entity_id = Column(Integer)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class AIDetection(Base):
    __tablename__ = "ai_detections"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_id = Column(Integer, ForeignKey("donation_images.id"), nullable=True)
    image_path = Column(String)
    detected_class = Column(String, nullable=False)
    category = Column(String)
    subcategory = Column(String)
    confidence = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    condition = Column(String, default="GOOD")
    bbox = Column(String)  # JSON string
    status = Column(String, default="PENDING_REVIEW") # PENDING_REVIEW, APPROVED, REJECTED, CONVERTED
    model_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    donation = relationship("Donation", back_populates="ai_detections")
    donor = relationship("User")
    image = relationship("DonationImage", back_populates="ai_detections")


class DonationRequest(Base):
    __tablename__ = "donation_requests"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=False)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    status = Column(Enum(DonationRequestStatus), default=DonationRequestStatus.PENDING)
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)

    donation = relationship("Donation")
    ngo = relationship("NGOProfile")
    donor = relationship("User", foreign_keys=[donor_id])
    match = relationship("Match")

    @property
    def donor_name(self):
        return self.donor.full_name if self.donor else None

    @property
    def donor_email(self):
        return self.donor.email if self.donor else None

    @property
    def donor_phone(self):
        return self.donor.phone if self.donor else None

    @property
    def created_at(self):
        return self.requested_at

    @property
    def pickup(self):
        if not self.donation:
            return None
        from sqlalchemy.orm import object_session
        session = object_session(self)
        if session:
            return session.query(Pickup).filter(
                Pickup.donation_id == self.donation_id,
                Pickup.ngo_id == self.ngo_id
            ).first()
        return None

    @property
    def items(self):
        if not self.donation:
            return []
        from sqlalchemy.orm import object_session
        from app.services.ngo_scoping import get_ngo_scoped_items
        session = object_session(self)
        if session:
            return get_ngo_scoped_items(session, self.donation.items, self.ngo_id)
        return self.donation.items if self.donation else []


class Pickup(Base):
    __tablename__ = "pickups"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=True)
    date = Column(DateTime, nullable=False)
    time_slot = Column(String)
    address = Column(String)
    volunteer = Column(String)
    notes = Column(Text)
    status = Column(Enum(PickupStatus), default=PickupStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    donation = relationship("Donation", back_populates="pickups")
    donor = relationship("User")
    ngo = relationship("NGOProfile")

    @property
    def items(self):
        if not self.donation or not self.ngo_id:
            return self.donation.items if self.donation else []
        from sqlalchemy.orm import object_session
        from app.services.ngo_scoping import get_ngo_scoped_items
        session = object_session(self)
        if session:
            return get_ngo_scoped_items(session, self.donation.items, self.ngo_id)
        return []



class DonationTrackingEvent(Base):
    __tablename__ = "donation_tracking_events"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    status = Column(String, nullable=False)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    metadata_json = Column(Text) # storing JSON as string

    donation = relationship("Donation")
    creator = relationship("User")

class DonationReceipt(Base):
    __tablename__ = "donation_receipts"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngo_profiles.id"), nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    confirmed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    donation = relationship("Donation")
    ngo = relationship("NGOProfile")
    confirmed_by = relationship("User")
    items = relationship("DonationReceiptItem", back_populates="receipt", cascade="all, delete-orphan")

class DonationReceiptItem(Base):
    __tablename__ = "donation_receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("donation_receipts.id"), nullable=False)
    donation_item_id = Column(Integer, ForeignKey("donation_items.id"), nullable=False)
    expected_quantity = Column(Integer, nullable=False)
    received_quantity = Column(Integer, nullable=False)
    condition = Column(Enum(ItemCondition), nullable=False)

    receipt = relationship("DonationReceipt", back_populates="items")
    donation_item = relationship("DonationItem")


class DeliveryOTP(Base):
    __tablename__ = "delivery_otps"
    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False, index=True)
    pickup_id = Column(Integer, ForeignKey("pickups.id"), nullable=True, index=True)
    otp_hash = Column(String, nullable=False)
    otp_encrypted = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    is_verified = Column(Boolean, default=False)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    delivery_photo_url = Column(String, nullable=True)

    donation = relationship("Donation")
    pickup = relationship("Pickup")
    verified_by = relationship("User")


class DeliveryProof(Base):
    __tablename__ = "delivery_proofs"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donations.id"), nullable=False, index=True)
    pickup_id = Column(Integer, ForeignKey("pickups.id"), nullable=True, index=True)
    otp_id = Column(Integer, ForeignKey("delivery_otps.id"), nullable=True, index=True)
    photo_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)

    donation = relationship("Donation", back_populates="delivery_proofs")
    pickup = relationship("Pickup")
    otp = relationship("DeliveryOTP")
    verified_by = relationship("User")

