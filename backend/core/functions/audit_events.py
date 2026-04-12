from sqlalchemy import event, inspect
from flask import request
from flask_jwt_extended import get_jwt_identity
from core import db
from .models import AuditLog
import json
from enum import Enum
from datetime import datetime, date
from decimal import Decimal


@event.listens_for(db.session, "before_commit")
def audit_before_commit(session):
    
    print("🔥 AUDIT EVENT FIRED")

    for obj in session.new:
        if isinstance(obj, AuditLog):
            continue

        session.add(AuditLog(
            user_id=_user(),
            action="CREATE",
            entity=obj.__class__.__name__,
            entity_id=_get_id(obj),
            snapshot=_snapshot(obj),
            ip_address=_ip()
        ))

    for obj in session.deleted:
        if isinstance(obj, AuditLog):
            continue

        session.add(AuditLog(
            user_id=_user(),
            action="DELETE",
            entity=obj.__class__.__name__,
            entity_id=_get_id(obj),
            snapshot=_snapshot(obj),
            ip_address=_ip()
        ))

    for obj in session.dirty:
        if isinstance(obj, AuditLog):
            continue

        changes = diff(obj)

        if changes:
            session.add(AuditLog(
                user_id=_user(),
                action="UPDATE",
                entity=obj.__class__.__name__,
                entity_id=_get_id(obj),
                changes=safe_json(changes),
                snapshot=safe_json(_snapshot(obj)),
                ip_address=_ip()
            ))
            
def diff(instance):
    insp = inspect(instance)
    changes = {}

    for attr in insp.mapper.column_attrs:
        hist = getattr(insp.attrs, attr.key).history

        if hist.has_changes():
            changes[attr.key] = {
                "old": hist.deleted[0] if hist.deleted else None,
                "new": hist.added[0] if hist.added else None
            }

    return changes

def _snapshot(obj):
    try:
        return {
            c.key: _serialize(getattr(obj, c.key))
            for c in inspect(obj).mapper.column_attrs
        }
    except Exception as e:
        print("Snapshot error:", e)
        return None
    
def _user():
    try:
        uid = get_jwt_identity()
        return uid if uid is not None else 0
    except:
        return 0

def _ip():
    try:
        return request.remote_addr
    except:
        return None


def _get_id(obj):
    return str(getattr(obj, "id", None))

def safe_json(data):
    return json.dumps(data, default=str, ensure_ascii=False)

def _serialize(value):
    if isinstance(value, Enum):
        return value.value  # or value.name
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value