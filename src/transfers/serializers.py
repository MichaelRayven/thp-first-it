from decimal import Decimal
from typing import Any

from rest_framework import serializers

from .models import (
    CashFlowRecord,
    Category,
    Status,
    Subcategory,
    TransactionType,
)


class StatusSerializer(serializers.ModelSerializer):
    """Serializer for Status model"""

    class Meta:
        model = Status
        fields = ['id', 'name', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']


class TransactionTypeSerializer(serializers.ModelSerializer):
    """Serializer for TransactionType model"""

    class Meta:
        model = TransactionType
        fields = ['id', 'name', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""

    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']


class SubcategorySerializer(serializers.ModelSerializer):
    """Serializer for Subcategory model"""

    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Subcategory
        fields = ['id', 'category', 'category_id', 'name', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']

    def validate_category_id(self, value: int) -> int:
        """Validate that the category exists and is active"""
        try:
            category = Category.objects.get(id=value)
        except Category.DoesNotExist:
            raise serializers.ValidationError('Category does not exist') from None
        else:
            if not category.is_active:
                raise serializers.ValidationError('Selected category is not active')
            return value


class CashFlowRecordSerializer(serializers.ModelSerializer):
    """Serializer for CashFlowRecord model"""

    status = StatusSerializer(read_only=True)
    transaction_type = TransactionTypeSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    subcategory = SubcategorySerializer(read_only=True)

    class Meta:
        model = CashFlowRecord
        fields = [
            'id',
            'status',
            'transaction_type',
            'category',
            'subcategory',
            'amount',
            'comment',
            'created_at',
            'updated_at',
            'is_active',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value: Decimal) -> Decimal:
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0')
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Validate relationships and business rules"""
        category_id = attrs.get('category_id')
        subcategory_id = attrs.get('subcategory_id')

        # Validate subcategory belongs to category
        if subcategory_id and category_id:
            try:
                subcategory = Subcategory.objects.get(id=subcategory_id)
                if subcategory.category_id != category_id:
                    raise serializers.ValidationError(
                        'Subcategory must belong to the selected category',
                    )
            except Subcategory.DoesNotExist:
                pass  # Already validated in field validation

        return attrs

    def create(self, validated_data: dict[str, Any]) -> CashFlowRecord:
        """Create a new CashFlowRecord instance"""
        # Map the _id fields to the actual foreign key fields
        validated_data['status'] = Status.objects.get(id=validated_data.pop('status_id'))
        validated_data['transaction_type'] = TransactionType.objects.get(
            id=validated_data.pop('transaction_type_id'),
        )
        validated_data['category'] = Category.objects.get(id=validated_data.pop('category_id'))
        validated_data['subcategory'] = Subcategory.objects.get(
            id=validated_data.pop('subcategory_id'),
        )

        return super().create(validated_data)

    def update(self, instance: CashFlowRecord, validated_data: dict[str, Any]) -> CashFlowRecord:
        """Update a CashFlowRecord instance"""
        # Map the _id fields to the actual foreign key fields
        if 'status_id' in validated_data:
            instance.status = Status.objects.get(id=validated_data.pop('status_id'))
        if 'transaction_type_id' in validated_data:
            instance.transaction_type = TransactionType.objects.get(
                id=validated_data.pop('transaction_type_id'),
            )
        if 'category_id' in validated_data:
            instance.category = Category.objects.get(id=validated_data.pop('category_id'))
        if 'subcategory_id' in validated_data:
            instance.subcategory = Subcategory.objects.get(id=validated_data.pop('subcategory_id'))

        return super().update(instance, validated_data)


class CashFlowRecordCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating CashFlowRecord with validation"""

    class Meta:
        model = CashFlowRecord
        fields = [
            'status',
            'transaction_type',
            'category',
            'subcategory',
            'amount',
            'comment',
        ]

    def validate_amount(self, value: Decimal) -> Decimal:
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0')
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Validate relationships and business rules"""
        status = attrs.get('status')
        transaction_type = attrs.get('transaction_type')
        category = attrs.get('category')
        subcategory = attrs.get('subcategory')

        # Check if related objects are active
        if status and not status.is_active:
            raise serializers.ValidationError('Selected status is not active')

        if transaction_type and not transaction_type.is_active:
            raise serializers.ValidationError('Selected transaction type is not active')

        if category and not category.is_active:
            raise serializers.ValidationError('Selected category is not active')

        if subcategory and not subcategory.is_active:
            raise serializers.ValidationError('Selected subcategory is not active')

        # Validate subcategory belongs to category
        if subcategory and category and subcategory.category != category:
            raise serializers.ValidationError('Subcategory must belong to the selected category')

        return attrs
