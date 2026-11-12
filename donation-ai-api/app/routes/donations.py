from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.db_models import User, Donation, DonationItem, DonationStatusHistory, AIDetection, Inventory, Category, DonationStatus, Match, DonationImage, Notification, ItemCondition, DonationItemAllocation, AllocationStatus, NGOProfile, DonationRequest, DonationRequestStatus, Demand, DemandStatus
from app.services.auth import require_donor, require_ngo, get_current_user
from app.schemas import DonationCreate, DonationResponse, DonationStatusUpdate, DonationStatusHistoryResponse, MatchResponse, DonationUpdate, DonationItemMatchesResponse, ItemMatchDetail, ItemMatchNGO, ItemAllocationRequest, ItemAllocationResponse, ItemAllocationInfo
from app.services.matcher import calculate_matches
from app.services.ngo_scoping import get_ngo_scoped_items

router = APIRouter(prefix="/donations", tags=["Donations"])

@router.post("/", response_model=DonationResponse)
def create_donation(donation: DonationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_donor)):
    try:
        db_donation = Donation(
            donor_id=current_user.id,
            ngo_id=donation.ngo_id,
            title=donation.title,
            description=donation.description,
            pickup_address=donation.pickup_address,
            pickup_city=donation.pickup_city,
            pickup_state=donation.pickup_state,
            pickup_postal_code=donation.pickup_postal_code,
            pickup_latitude=donation.pickup_latitude,
            pickup_longitude=donation.pickup_longitude,
            pickup_scheduled_at=donation.pickup_scheduled_at,
            delivery_address=donation.delivery_address,
            notes=donation.notes,
            status=DonationStatus.PENDING
        )
        db.add(db_donation)
        db.flush()

        # Rule 1 & 7: Consolidate duplicate items and avoid duplicate DonationItems for repeated AI detection
        processed_items = []
        seen_detections = set()
        seen_keys = {}

        for item in donation.items:
            # Safe quantity handling
            raw_qty = item.quantity if (item.quantity and item.quantity > 0) else 1
            det_id = getattr(item, 'ai_detection_id', None)

            # If detection id already processed in this donation, consolidate quantity
            if det_id and det_id in seen_detections:
                target_idx = seen_keys.get(f"det_{det_id}")
                if target_idx is not None:
                    processed_items[target_idx]["quantity"] += raw_qty
                continue

            # Check if identical item (name + category + subcategory + condition) was passed
            item_key = f"{str(item.item_name).strip().lower()}_{str(item.category).strip().lower()}_{str(item.subcategory).strip().lower()}_{str(item.condition).strip().lower()}"
            if not det_id and item_key in seen_keys:
                target_idx = seen_keys[item_key]
                processed_items[target_idx]["quantity"] += raw_qty
                continue

            idx = len(processed_items)
            if det_id:
                seen_detections.add(det_id)
                seen_keys[f"det_{det_id}"] = idx
            else:
                seen_keys[item_key] = idx

            processed_items.append({
                "item_name": item.item_name or "Donation Item",
                "category_id": item.category_id,
                "category": item.category or "General",
                "subcategory": item.subcategory,
                "quantity": raw_qty,
                "condition": item.condition,
                "confidence": item.confidence,
                "unit": item.unit,
                "image_url": item.image_url,
                "detection_source": item.detection_source,
                "description": item.description,
                "ai_detection_id": det_id
            })

        for p_item in processed_items:
            cond_val = ItemCondition.GOOD
            if p_item["condition"]:
                c_upper = str(p_item["condition"]).upper()
                if "NEW" in c_upper:
                    cond_val = ItemCondition.NEW
                elif "FAIR" in c_upper:
                    cond_val = ItemCondition.FAIR
                elif "POOR" in c_upper:
                    cond_val = ItemCondition.POOR

            db_item = DonationItem(
                donation_id=db_donation.id,
                item_name=p_item["item_name"],
                category_id=p_item["category_id"],
                category=p_item["category"],
                subcategory=p_item["subcategory"],
                quantity=p_item["quantity"],
                condition=cond_val,
                confidence=p_item["confidence"],
                unit=p_item["unit"],
                image_url=p_item["image_url"],
                detection_source=p_item["detection_source"],
                description=p_item["description"],
                ai_detection_id=p_item["ai_detection_id"]
            )
            db.add(db_item)
            
            # If item came from AI Detection, link the AIDetection to this donation
            if p_item["ai_detection_id"]:
                try:
                    detection = db.query(AIDetection).filter(
                        AIDetection.id == p_item["ai_detection_id"],
                        AIDetection.donor_id == current_user.id
                    ).first()
                    
                    if detection:
                        detection.donation_id = db_donation.id
                        
                        # Compare original AI guess with donor's confirmed values
                        if (detection.detected_class.lower() == p_item["item_name"].lower() and 
                            detection.quantity == p_item["quantity"]):
                            detection.status = "APPROVED"
                        else:
                            detection.status = "CONVERTED"
                            
                    # Also link the image if possible
                    if p_item["image_url"]:
                        img_filename = p_item["image_url"].split('/')[-1]
                        images = db.query(DonationImage).filter(
                            DonationImage.donor_id == current_user.id,
                            DonationImage.image_url.like(f"%{img_filename}"),
                            DonationImage.donation_id == None
                        ).all()
                        for img in images:
                            img.donation_id = db_donation.id
                except Exception as e:
                    pass
            elif not p_item["detection_source"]:
                # If no ai_detection_id and no explicit source, it's manual
                db_item.detection_source = "MANUAL"

        # Log creation
        log_status = DonationStatusHistory(
            donation_id=db_donation.id,
            old_status=None,
            new_status=DonationStatus.PENDING,
            changed_by_id=current_user.id,
            notes="Donation created"
        )
        db.add(log_status)
        
        # Notify Donor
        from app.services.notifications import create_idempotent_notification
        create_idempotent_notification(
            db=db,
            user_id=current_user.id,
            title="Donation Submitted",
            message=f"Your donation of {sum(i['quantity'] for i in processed_items)} item(s) has been submitted successfully and is pending review.",
            type="donations",
            related_entity_type="donation",
            related_entity_id=db_donation.id,
            recipient_role="DONOR"
        )
        
        db.commit()
        db.refresh(db_donation)
        return db_donation
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def _attach_delivery_proof_details(donation):
    donation.delivery_verified_at = None
    donation.delivery_verified_by = None
    if donation.delivery_proofs and len(donation.delivery_proofs) > 0:
        proof = donation.delivery_proofs[0]
        donation.delivery_verified_at = proof.verified_at
        if proof.verified_by:
            donation.delivery_verified_by = proof.verified_by.full_name or proof.verified_by.email
    return donation

@router.get("/", response_model=List[DonationResponse])
def get_donations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    donations = []
    if current_user.role.value in ["DONOR", "donor"]:
        donations = db.query(Donation).filter(Donation.donor_id == current_user.id).all()
    elif current_user.role.value in ["NGO", "ngo"]:
        if not current_user.ngo_profile:
            return []
        ngo_id = current_user.ngo_profile.id
        req_don_ids = db.query(DonationRequest.donation_id).filter(DonationRequest.ngo_id == ngo_id).all()
        alloc_don_ids = db.query(DonationItem.donation_id).join(DonationItemAllocation).filter(DonationItemAllocation.ngo_id == ngo_id).all()
        all_ids = set([d.id for d in db.query(Donation.id).filter(Donation.ngo_id == ngo_id).all()])
        for (did,) in req_don_ids + alloc_don_ids:
            if did: all_ids.add(did)
        donations = db.query(Donation).filter(Donation.id.in_(list(all_ids))).all() if all_ids else []
    else:
        donations = db.query(Donation).all() # Admin gets all
    
    result = []
    from app.schemas import DonationResponse
    for d in donations:
        d_copy = _attach_delivery_proof_details(d)
        if current_user.role.value in ["NGO", "ngo"] and current_user.ngo_profile:
            ngo_id = current_user.ngo_profile.id
            
            d_model = DonationResponse.from_orm(d_copy)
            d_model.items = get_ngo_scoped_items(db, d_copy.items, ngo_id)
            d_model.pickups = [p for p in getattr(d_model, "pickups", []) if getattr(p, "ngo_id", None) == ngo_id] if hasattr(d_model, "pickups") else []
            d_model.pickup = next((p for p in (d_copy.pickups or []) if getattr(p, "ngo_id", None) == ngo_id), None)
            
            has_req = db.query(DonationRequest).filter(DonationRequest.donation_id == d_copy.id, DonationRequest.ngo_id == ngo_id).first()
            if has_req:
                from app.services.donation_status import RANK_TO_DONATION_STATUS, get_status_rank
                req_rank = get_status_rank(has_req.status)
                parent_rank = get_status_rank(d_model.status)
                if req_rank > parent_rank:
                    scoped_status = RANK_TO_DONATION_STATUS.get(req_rank)
                    if scoped_status:
                        d_model.status = scoped_status
            result.append(d_model)
        else:
            result.append(DonationResponse.from_orm(d_copy))
    return result

@router.get("/{donation_id}", response_model=DonationResponse)
def get_donation(
    donation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    if current_user.role.value in ["DONOR", "donor"] and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this donation")
    elif current_user.role.value in ["NGO", "ngo"]:
        ngo_id = current_user.ngo_profile.id if current_user.ngo_profile else None
        if not ngo_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this donation")
            
        has_req = db.query(DonationRequest).filter(DonationRequest.donation_id == donation_id, DonationRequest.ngo_id == ngo_id).first()
        has_alloc = db.query(DonationItemAllocation).join(DonationItem).filter(DonationItem.donation_id == donation_id, DonationItemAllocation.ngo_id == ngo_id).first()
        
        if donation.ngo_id != ngo_id and not has_req and not has_alloc:
            raise HTTPException(status_code=403, detail="Not authorized to view this donation")
            
        donation = _attach_delivery_proof_details(donation)
        donation.items = get_ngo_scoped_items(db, donation.items, ngo_id)
        
        # Convert to Pydantic model so we can safely modify attributes without SQLAlchemy tracking them
        from app.schemas import DonationResponse
        donation_model = DonationResponse.from_orm(donation)
        
        # Scope pickups
        donation_model.pickups = [p for p in donation_model.pickups if p.ngo_id == ngo_id] if hasattr(donation_model, "pickups") else []
        donation_model.pickup = next((p for p in (donation.pickups or []) if p.ngo_id == ngo_id), None)
        
        if has_req:
            from app.services.donation_status import RANK_TO_DONATION_STATUS, get_status_rank
            req_rank = get_status_rank(has_req.status)
            parent_rank = get_status_rank(donation_model.status)
            if req_rank > parent_rank:
                scoped_status = RANK_TO_DONATION_STATUS.get(req_rank)
                if scoped_status:
                    donation_model.status = scoped_status
                    
        return donation_model

    return _attach_delivery_proof_details(donation)

@router.get("/{donation_id}/delivery-otp")
def get_delivery_otp(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.delivery_otp import get_active_otp_for_donor
    return get_active_otp_for_donor(db, donation_id, current_user)

@router.post("/{donation_id}/delivery-otp/resend")
def resend_delivery_otp_endpoint(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.delivery_otp import generate_delivery_otp
    from app.db_models import Pickup
    
    # Verify the user is authorized (donor owner, matched NGO, or admin)
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    is_admin = current_user.role.value.upper() == 'ADMIN'
    is_donor = donation.donor_id == current_user.id
    
    is_matched_ngo = False
    if current_user.role.value.upper() == 'NGO':
        from app.db_models import NGOProfile
        ngo_profile = db.query(NGOProfile).filter(NGOProfile.user_id == current_user.id).first()
        if ngo_profile and donation.ngo_id == ngo_profile.id:
            is_matched_ngo = True

    if not (is_admin or is_donor or is_matched_ngo):
        raise HTTPException(status_code=403, detail="Not authorized to resend OTP for this donation")

    pickup = db.query(Pickup).filter(Pickup.donation_id == donation_id).first()
    pickup_id = pickup.id if pickup else None

    # Call the existing generation service which will invalidate old and send new
    generate_delivery_otp(db, donation_id, pickup_id, force_new=True)
    return {"success": True, "message": "A new delivery verification OTP has been sent."}

@router.put("/{donation_id}/status")
def update_status(donation_id: int, status_update: DonationStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    old_status = donation.status.value
    new_status = status_update.status.upper()
    
    # If transitioning to DELIVERED, enforce secure delivery photo proof and OTP verification
    if new_status == DonationStatus.DELIVERED.value:
        if old_status != DonationStatus.COLLECTED.value:
            raise HTTPException(
                status_code=400,
                detail=f"Donation must be in COLLECTED status to be delivered. Current status is {old_status}."
            )
        from app.services.delivery_proof import has_persisted_delivery_proof
        if not has_persisted_delivery_proof(db, donation.id):
            raise HTTPException(
                status_code=400,
                detail="Delivery photo proof and OTP verification are strictly required to mark donation as DELIVERED. Please submit proof via the delivery verification endpoint."
            )
    # RECEIVED is FINAL and requires physical NGO receipt verification with item-level data.
    # It must ONLY be set via the dedicated receipt endpoint (POST /status/donations/{id}/receipt).
    if new_status == DonationStatus.RECEIVED.value:
        raise HTTPException(
            status_code=400,
            detail="RECEIVED status can only be set via the receipt confirmation endpoint. NGO must physically verify items, quantities, and conditions."
        )

    donation.status = new_status
    
    # Legacy inventory update block kept but unreachable for RECEIVED (blocked above)
    
    log = DonationStatusHistory(
        donation_id=donation.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_id=current_user.id,
        notes=status_update.notes,
        remarks=status_update.remarks
    )
    db.add(log)
    db.commit()
    return {"success": True, "message": f"Status updated to {new_status}"}


@router.get("/{donation_id}/matches", response_model=List[MatchResponse])
def get_donation_matches(
    donation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    # Only the owner donor, or an admin can view these matches
    if current_user.role.value == "DONOR" and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view matches for this donation")
        
    # Generate/update matches if donation is still active/pending
    if donation.status == DonationStatus.PENDING:
        calculate_matches(db, donation_id)
        
    # Fetch and return matches
    matches = db.query(Match).join(DonationItem).filter(DonationItem.donation_id == donation_id).order_by(Match.overall_score.desc()).all()
    return matches

@router.get("/{donation_id}/item-matches", response_model=DonationItemMatchesResponse)
def get_donation_item_matches(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns item-level NGO matches for a donation.
    Each detected item is listed independently with its own NGO allocations."""
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    if current_user.role.value == "DONOR" and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view matches for this donation")

    # Generate matches if donation is still pending
    if donation.status == DonationStatus.PENDING:
        calculate_matches(db, donation_id)

    # Build the item-level response
    items_response = []
    fully_matched = 0
    partially_matched = 0
    unmatched = 0

    for item in donation.items:
        # Get all matches for this specific item
        item_matches = db.query(Match).filter(
            Match.donation_item_id == item.id
        ).order_by(Match.overall_score.desc()).all()

        ngo_matches = []
        seen_ngo_ids = set()
        for m in item_matches:
            if not m.demand:
                try:
                    db.delete(m)
                except Exception:
                    pass
                continue

            demand_status = str(m.demand.status.value if hasattr(m.demand.status, 'value') else m.demand.status).upper()
            if demand_status == "CANCELLED":
                try:
                    db.delete(m)
                except Exception:
                    pass
                continue

            ngo_name = None
            ngo_id = None
            requested_qty = 0
            if m.demand and m.demand.ngo:
                ngo_name = m.demand.ngo.organization_name
                ngo_id = m.demand.ngo_id
                requested_qty = m.demand.quantity_required

            if not ngo_id or ngo_id in seen_ngo_ids:
                continue
            seen_ngo_ids.add(ngo_id)

            ngo_matches.append(ItemMatchNGO(
                match_id=m.id,
                ngo_id=ngo_id or 0,
                ngo_name=ngo_name,
                demand_id=m.demand_id,
                requested_quantity=requested_qty,
                matched_quantity=m.matched_quantity,
                overall_score=m.overall_score,
                match_reason=m.match_reason,
                distance_km=m.distance_km,
                status=m.status.value if hasattr(m.status, 'value') else str(m.status)
            ))

        try:
            db.commit()
        except Exception:
            db.rollback()

        remaining = item.quantity - item.allocated_quantity
        matching_status = item.matching_status or "PENDING"

        if item.allocated_quantity >= item.quantity:
            fully_matched += 1
        elif item.allocated_quantity > 0:
            partially_matched += 1
        else:
            unmatched += 1

        allocations_list = []
        item_allocations = db.query(DonationItemAllocation).filter(
            DonationItemAllocation.donation_item_id == item.id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).all()

        for alloc in item_allocations:
            alloc_ngo_name = alloc.ngo.organization_name if alloc.ngo else f"NGO #{alloc.ngo_id}"
            allocations_list.append(ItemAllocationInfo(
                allocation_id=alloc.id,
                ngo_id=alloc.ngo_id,
                ngo_name=alloc_ngo_name,
                allocated_quantity=alloc.allocated_quantity,
                status=alloc.status.value if hasattr(alloc.status, 'value') else str(alloc.status)
            ))

        items_response.append(ItemMatchDetail(
            item_id=item.id,
            item_name=item.item_name,
            category=item.category,
            subcategory=item.subcategory,
            donated_quantity=item.quantity,
            allocated_quantity=item.allocated_quantity,
            remaining_quantity=remaining,
            matching_status=matching_status,
            confidence=item.confidence,
            allocations=allocations_list,
            matches=ngo_matches
        ))

    return DonationItemMatchesResponse(
        donation_id=donation.id,
        donation_title=donation.title,
        donation_status=donation.status.value if hasattr(donation.status, 'value') else str(donation.status),
        total_items=len(donation.items),
        fully_matched_items=fully_matched,
        partially_matched_items=partially_matched,
        unmatched_items=unmatched,
        items=items_response
    )

@router.post("/items/{item_id}/allocate", response_model=ItemAllocationResponse)
def allocate_item_ngo(
    item_id: int,
    req: ItemAllocationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allocates a specific quantity of a DonationItem to an NGO.
    Enforces strict safeguards: NGO demand limits, category compatibility, quantity ceilings, and safe zero handling."""
    item = db.query(DonationItem).filter(DonationItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Donation item not found")

    donation = item.donation
    if current_user.role.value in ["DONOR", "donor"] and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to allocate items for this donation")

    ngo = db.query(NGOProfile).filter(NGOProfile.id == req.ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found")

    # Rule 10: Handle negative quantity safely
    if req.allocated_quantity < 0:
        raise HTTPException(status_code=400, detail="Allocated quantity cannot be negative")

    # Rule 3: Total allocated quantity must never exceed detected quantity
    existing_allocations = db.query(DonationItemAllocation).filter(
        DonationItemAllocation.donation_item_id == item_id,
        DonationItemAllocation.status != AllocationStatus.REJECTED
    ).all()

    other_allocated = sum(a.allocated_quantity for a in existing_allocations if a.ngo_id != req.ngo_id)
    available_for_ngo = max(0, item.quantity - other_allocated)

    if req.allocated_quantity > available_for_ngo:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot allocate {req.allocated_quantity} items to {ngo.organization_name}. Only {available_for_ngo} unallocated {item.item_name} remaining (Total detected: {item.quantity})."
        )

    # Rule 5 & 6: NGO Category Check & Demand Ceiling (Rule 4)
    if req.allocated_quantity > 0:
        from app.services.matcher import are_categories_compatible
        ngo_demands = db.query(Demand).filter(
            Demand.ngo_id == req.ngo_id,
            Demand.status.in_([DemandStatus.OPEN, DemandStatus.active, DemandStatus.PARTIALLY_FULFILLED, DemandStatus.partially_fulfilled])
        ).all()
        
        compatible_demands = [
            d for d in ngo_demands 
            if are_categories_compatible(item.category, item.subcategory, item.item_name, d.category, d.subcategory, d.item_name)
        ]
        
        if ngo_demands and not compatible_demands:
            raise HTTPException(
                status_code=400,
                detail=f"{ngo.organization_name} has only requested other categories, not '{item.category or item.item_name}'."
            )

        if compatible_demands:
            total_remaining_demand = sum(max(0, d.quantity_required - d.quantity_fulfilled) for d in compatible_demands)
            existing_ngo_alloc = next((a for a in existing_allocations if a.ngo_id == req.ngo_id), None)
            existing_ngo_qty = existing_ngo_alloc.allocated_quantity if existing_ngo_alloc else 0
            max_ngo_allowed = total_remaining_demand + existing_ngo_qty
            
            if req.allocated_quantity > max_ngo_allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot allocate {req.allocated_quantity} items to {ngo.organization_name}. Exceeds their remaining requested demand of {max_ngo_allowed}."
                )

    # Rule 8 & 9: In-place update / recalculate allocation instead of creating duplicates
    existing_alloc = db.query(DonationItemAllocation).filter(
        DonationItemAllocation.donation_item_id == item_id,
        DonationItemAllocation.ngo_id == req.ngo_id
    ).first()

    if req.allocated_quantity == 0:
        if existing_alloc:
            db.delete(existing_alloc)
    else:
        if existing_alloc:
            existing_alloc.allocated_quantity = req.allocated_quantity
            if existing_alloc.status not in [AllocationStatus.ACCEPTED, AllocationStatus.FULFILLED]:
                existing_alloc.status = AllocationStatus.PENDING
            existing_alloc.updated_at = datetime.utcnow()
        else:
            new_alloc = DonationItemAllocation(
                donation_item_id=item_id,
                ngo_id=req.ngo_id,
                allocated_quantity=req.allocated_quantity,
                status=AllocationStatus.PENDING
            )
            db.add(new_alloc)

    db.flush()
    active_allocations = db.query(DonationItemAllocation).filter(
        DonationItemAllocation.donation_item_id == item_id,
        DonationItemAllocation.status != AllocationStatus.REJECTED
    ).all()
    total_allocated = sum(a.allocated_quantity for a in active_allocations)
    item.allocated_quantity = min(item.quantity, total_allocated)

    if item.allocated_quantity >= item.quantity:
        item.matching_status = "FULLY_MATCHED"
    elif item.allocated_quantity > 0:
        item.matching_status = "PARTIALLY_MATCHED"
    else:
        item.matching_status = "PENDING"

    if req.allocated_quantity > 0:
        if donation.ngo_id is None:
            donation.ngo_id = req.ngo_id

        existing_req = db.query(DonationRequest).filter(
            DonationRequest.donation_id == donation.id,
            DonationRequest.ngo_id == req.ngo_id
        ).first()

        if not existing_req:
            new_req = DonationRequest(
                donation_id=donation.id,
                ngo_id=req.ngo_id,
                donor_id=current_user.id,
                match_id=req.match_id,
                status=DonationRequestStatus.PENDING
            )
            db.add(new_req)

        if donation.status == DonationStatus.PENDING:
            donation.status = DonationStatus.MATCHED

        # Send item-level notification to the allocated NGO
        if ngo.user_id:
            from app.services.notifications import create_idempotent_notification
            notif_title = f"New {item.item_name.title()} Match"
            notif_msg = f"New {item.item_name.lower()} donation matched to your NGO — Quantity: {req.allocated_quantity}"
            create_idempotent_notification(
                db=db,
                user_id=ngo.user_id,
                title=notif_title,
                message=notif_msg,
                type="matches",
                related_entity_type="donation_item",
                related_entity_id=item.id,
                recipient_role="NGO"
            )
    else:
        # Rule 10: Safe zero cleanup - check if NGO has other items on this donation
        other_item_allocs = db.query(DonationItemAllocation).join(DonationItem).filter(
            DonationItem.donation_id == donation.id,
            DonationItemAllocation.ngo_id == req.ngo_id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).count()
        if other_item_allocs == 0:
            pending_req = db.query(DonationRequest).filter(
                DonationRequest.donation_id == donation.id,
                DonationRequest.ngo_id == req.ngo_id,
                DonationRequest.status == DonationRequestStatus.PENDING
            ).first()
            if pending_req:
                db.delete(pending_req)

        # Check if ALL items on this donation now have 0 allocations
        all_allocs_count = db.query(DonationItemAllocation).join(DonationItem).filter(
            DonationItem.donation_id == donation.id,
            DonationItemAllocation.status != AllocationStatus.REJECTED
        ).count()
        if all_allocs_count == 0:
            if donation.status == DonationStatus.MATCHED:
                donation.status = DonationStatus.PENDING
            donation.ngo_id = None
        elif donation.ngo_id == req.ngo_id:
            # Switch donation.ngo_id to another remaining allocated NGO
            remaining_alloc = db.query(DonationItemAllocation).join(DonationItem).filter(
                DonationItem.donation_id == donation.id,
                DonationItemAllocation.status != AllocationStatus.REJECTED
            ).first()
            if remaining_alloc:
                donation.ngo_id = remaining_alloc.ngo_id

    db.commit()

    return ItemAllocationResponse(
        success=True,
        message=f"Successfully allocated {req.allocated_quantity} × {item.item_name} to {ngo.organization_name}",
        item_id=item.id,
        donated_quantity=item.quantity,
        allocated_quantity=item.allocated_quantity,
        remaining_quantity=max(0, item.quantity - item.allocated_quantity),
        matching_status=item.matching_status
    )

@router.put("/{donation_id}", response_model=DonationResponse)
def update_donation(
    donation_id: int, 
    donation_update: DonationUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
        
    if current_user.role.value in ["DONOR", "donor"] and donation.donor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this donation")
        
    if donation.status.value not in ["PENDING", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Only pending donations can be edited")
        
    if donation_update.title is not None:
        donation.title = donation_update.title
    if donation_update.description is not None:
        donation.description = donation_update.description
        
    # Rule 8: Stable IDs for DonationItem — Update existing items in-place instead of blind DELETE + INSERT
    if donation_update.items is not None:
        existing_items_by_id = {item.id: item for item in donation.items}
        processed_item_ids = set()

        for item_data in donation_update.items:
            cond_val = ItemCondition.GOOD
            if item_data.condition:
                c_upper = str(item_data.condition).upper()
                if "NEW" in c_upper:
                    cond_val = ItemCondition.NEW
                elif "FAIR" in c_upper:
                    cond_val = ItemCondition.FAIR
                elif "POOR" in c_upper:
                    cond_val = ItemCondition.POOR

            # Check if item ID was supplied and exists
            matched_item = None
            if item_data.id and item_data.id in existing_items_by_id:
                matched_item = existing_items_by_id[item_data.id]
            else:
                # Try matching by name and category among unprocessed items
                for eid, eitem in existing_items_by_id.items():
                    if eid not in processed_item_ids and eitem.item_name.strip().lower() == str(item_data.item_name).strip().lower():
                        matched_item = eitem
                        break

            new_qty = item_data.quantity if (item_data.quantity and item_data.quantity > 0) else 1

            if matched_item:
                matched_item.item_name = item_data.item_name or matched_item.item_name
                matched_item.category_id = item_data.category_id
                matched_item.category = item_data.category or matched_item.category
                matched_item.subcategory = item_data.subcategory or matched_item.subcategory
                matched_item.quantity = new_qty
                matched_item.condition = cond_val
                matched_item.confidence = item_data.confidence
                matched_item.unit = item_data.unit
                matched_item.image_url = item_data.image_url
                matched_item.detection_source = item_data.detection_source
                matched_item.description = item_data.description
                if item_data.ai_detection_id:
                    matched_item.ai_detection_id = item_data.ai_detection_id
                
                # Re-clamp allocated quantity
                matched_item.allocated_quantity = min(matched_item.quantity, matched_item.allocated_quantity)
                if matched_item.allocated_quantity >= matched_item.quantity:
                    matched_item.matching_status = "FULLY_MATCHED"
                elif matched_item.allocated_quantity > 0:
                    matched_item.matching_status = "PARTIALLY_MATCHED"
                else:
                    matched_item.matching_status = "PENDING"

                processed_item_ids.add(matched_item.id)
            else:
                # Create brand new item
                new_db_item = DonationItem(
                    donation_id=donation.id,
                    item_name=item_data.item_name or "Donation Item",
                    category_id=item_data.category_id,
                    category=item_data.category or "General",
                    subcategory=item_data.subcategory,
                    quantity=new_qty,
                    condition=cond_val,
                    confidence=item_data.confidence,
                    unit=item_data.unit,
                    image_url=item_data.image_url,
                    detection_source=item_data.detection_source or "MANUAL",
                    description=item_data.description,
                    ai_detection_id=item_data.ai_detection_id
                )
                db.add(new_db_item)

        # Clean up any removed items
        for eid, eitem in existing_items_by_id.items():
            if eid not in processed_item_ids:
                # Delete orphan matches and allocations first
                db.query(Match).filter(Match.donation_item_id == eid).delete()
                db.query(DonationItemAllocation).filter(DonationItemAllocation.donation_item_id == eid).delete()
                db.delete(eitem)

    db.commit()
    db.refresh(donation)
    return _attach_delivery_proof_details(donation)
