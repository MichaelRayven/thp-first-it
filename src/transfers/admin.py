from django.contrib import admin
from django.contrib.admin import display
from django.utils.html import format_html
from django.utils.safestring import SafeString

from .models import (
    CashFlowRecord,
    Category,
    Status,
    Subcategory,
    TransactionType,
)


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    list_editable = ['is_active']


@admin.register(TransactionType)
class TransactionTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    list_editable = ['is_active']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    list_editable = ['is_active']


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'category__name']
    list_editable = ['is_active']
    autocomplete_fields = ['category']


@admin.register(CashFlowRecord)
class CashFlowRecordAdmin(admin.ModelAdmin):
    list_display = [
        'status',
        'transaction_type',
        'category',
        'subcategory',
        'amount_display',
        'comment_preview',
        'created_at',
    ]
    list_filter = [
        'status',
        'transaction_type',
        'category',
        'subcategory',
        'created_at',
    ]
    search_fields = ['comment', 'category__name', 'subcategory__name']
    autocomplete_fields = ['status', 'transaction_type', 'category', 'subcategory']
    ordering = ['-created_at']

    fieldsets = (
        ('Основная информация', {'fields': ('status', 'transaction_type')}),
        ('Категоризация', {'fields': ('category', 'subcategory')}),
        ('Финансовая информация', {'fields': ('amount',)}),
        ('Дополнительно', {'fields': ('comment', 'is_active'), 'classes': ('collapse',)}),
    )

    @display(description='Сумма')
    def amount_display(self, obj: CashFlowRecord) -> SafeString:
        """Отображение суммы с форматированием"""
        return format_html(
            '<span style="font-weight: bold; color: {};">{:.2f} р.</span>',
            'green' if obj.transaction_type.name == 'Пополнение' else 'red',
            obj.amount,
        )

    @display(description='Комментарий')
    def comment_preview(self, obj: CashFlowRecord) -> str:
        """Превью комментария"""
        if obj.comment:
            return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment  # noqa: PLR2004
        return '-'
