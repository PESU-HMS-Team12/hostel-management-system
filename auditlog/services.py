from .models import AuditLog


def create_audit_log(user, action_type, entity_type, record_id):
    return AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action_type=action_type,
        entity_type=entity_type,
        record_id=str(record_id),
    )