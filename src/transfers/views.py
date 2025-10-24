import structlog
from django_filters import DateFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    CashFlowRecord,
    Category,
    Status,
    Subcategory,
    TransactionType,
)
from .serializers import (
    CashFlowRecordCreateSerializer,
    CashFlowRecordSerializer,
    CategorySerializer,
    StatusSerializer,
    SubcategorySerializer,
    TransactionTypeSerializer,
)

logger = structlog.get_logger(__name__)


class CashFlowRecordFilter(FilterSet):
    """Custom filter for CashFlowRecord with date range filtering"""

    created_at_after = DateFilter(field_name='created_at', lookup_expr='gte')
    created_at_before = DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = CashFlowRecord
        fields = [
            'status',
            'transaction_type',
            'category',
            'subcategory',
            'created_at_after',
            'created_at_before',
        ]


class StatusViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Status objects"""

    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def perform_destroy(self, instance: Status) -> None:
        """Soft delete by setting is_active to False"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def enable(self, request: Request, pk: str | None = None) -> Response:
        """Enable a status"""
        status_obj = self.get_object()
        status_obj.is_active = True
        status_obj.save()
        serializer = self.get_serializer(status_obj)
        return Response(serializer.data)


class TransactionTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing TransactionType objects"""

    queryset = TransactionType.objects.all()
    serializer_class = TransactionTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def perform_destroy(self, instance: TransactionType) -> None:
        """Soft delete by setting is_active to False"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def enable(self, request: Request, pk: str | None = None) -> Response:
        """Enable a transaction type"""
        transaction_type = self.get_object()
        transaction_type.is_active = True
        transaction_type.save()
        serializer = self.get_serializer(transaction_type)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Category objects"""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def perform_destroy(self, instance: Category) -> None:
        """Soft delete by setting is_active to False"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def enable(self, request: Request, pk: str | None = None) -> Response:
        """Enable a category"""
        category = self.get_object()
        category.is_active = True
        category.save()
        serializer = self.get_serializer(category)
        return Response(serializer.data)


class SubcategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Subcategory objects"""

    queryset = Subcategory.objects.select_related('category').all()
    serializer_class = SubcategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'category__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['category__name', 'name']

    def perform_destroy(self, instance: Subcategory) -> None:
        """Soft delete by setting is_active to False"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def enable(self, request: Request, pk: str | None = None) -> Response:
        """Enable a subcategory"""
        subcategory = self.get_object()
        subcategory.is_active = True
        subcategory.save()
        serializer = self.get_serializer(subcategory)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request: Request) -> Response:
        """Get subcategories filtered by category"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response({'subcategories': []})

        subcategories = self.queryset.filter(category_id=category_id, is_active=True).values(
            'id',
            'name',
        )

        return Response({'subcategories': list(subcategories)})


class CashFlowRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing CashFlowRecord objects"""

    queryset = CashFlowRecord.objects.select_related(
        'status',
        'transaction_type',
        'category',
        'subcategory',
    ).filter(is_active=True)
    serializer_class = CashFlowRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CashFlowRecordFilter
    search_fields = [
        'comment',
        'status__name',
        'transaction_type__name',
        'category__name',
        'subcategory__name',
    ]
    ordering_fields = ['amount', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self) -> type[serializers.ModelSerializer]:
        """Use different serializer for create/update operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return CashFlowRecordCreateSerializer
        return CashFlowRecordSerializer

    def perform_destroy(self, instance: CashFlowRecord) -> None:
        """Soft delete by setting is_active to False"""
        instance.is_active = False
        instance.save()
