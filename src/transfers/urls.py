from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CashFlowRecordViewSet,
    CategoryViewSet,
    StatusViewSet,
    SubcategoryViewSet,
    TransactionTypeViewSet,
)

app_name = 'transfers'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'statuses', StatusViewSet)
router.register(r'transaction-types', TransactionTypeViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'subcategories', SubcategoryViewSet)
router.register(r'cash-flow-records', CashFlowRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
