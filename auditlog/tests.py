from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import AuditLog


User = get_user_model()


class AuditLogModelTests(TestCase):

    def test_audit_log_creation(self):
        user = User.objects.create_user(
            username="testuser",
            password="testpass123",
        )

        log = AuditLog.objects.create(
            user=user,
            action_type="CREATE",
            entity_type="Student",
            record_id="S001",
        )

        self.assertEqual(log.user, user)
        self.assertEqual(log.action_type, "CREATE")
        self.assertEqual(log.entity_type, "Student")
        self.assertEqual(log.record_id, "S001")
        self.assertIsNotNone(log.timestamp)

    def test_audit_log_can_exist_without_user(self):
        log = AuditLog.objects.create(
            user=None,
            action_type="DELETE",
            entity_type="Room",
            record_id="R001",
        )

        self.assertIsNone(log.user)
        self.assertEqual(log.entity_type, "Room")
        self.assertEqual(log.record_id, "R001")