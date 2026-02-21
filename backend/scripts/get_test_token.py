#!/usr/bin/env python
"""获取测试用 JWT token"""
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_manager.settings')

import django
django.setup()

from api.models import User
from api.utils.jwt_util import encode

u, _ = User.objects.get_or_create(
    openid='test_openid_001',
    defaults={'nickname': '测试', 'role': 2, 'status': 1}
)
u.role = 2
u.save()
print(encode(u.id))
