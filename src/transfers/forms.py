from typing import TYPE_CHECKING, Any, cast

from django import forms

from .models import (
    CashFlowRecord,
    Category,
    Status,
    Subcategory,
    TransactionType,
)

if TYPE_CHECKING:
    from django.forms import ModelChoiceField


class CashFlowRecordForm(forms.ModelForm):
    """Форма для создания/редактирования записи ДДС"""

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
        widgets = {
            'amount': forms.NumberInput(
                attrs={'step': '0.01', 'min': '0.01', 'class': 'form-control'},
            ),
            'comment': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'transaction_type': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'subcategory': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        # Cast fields to ModelChoiceField for proper typing
        status_field = cast('ModelChoiceField', self.fields['status'])
        transaction_type_field = cast('ModelChoiceField', self.fields['transaction_type'])
        category_field = cast('ModelChoiceField', self.fields['category'])
        subcategory_field = cast('ModelChoiceField', self.fields['subcategory'])

        status_field.queryset = Status.objects.filter(is_active=True)
        transaction_type_field.queryset = TransactionType.objects.filter(is_active=True)
        category_field.queryset = Category.objects.filter(is_active=True)

        category_id = None
        if self.data and 'category' in self.data:
            # Если выбрана категория, показываем подкатегории
            category_id = self.data.get('category')
        elif self.instance.pk and self.instance.category:
            # Если редактируем существующую запись используем текущую категорию
            category_id = self.instance.category.id

        subcategory_field.queryset = (
            Subcategory.objects.filter(
                category_id=category_id,
                is_active=True,
            )
            if category_id
            else Subcategory.objects.none()
        )


class StatusForm(forms.ModelForm):
    """Форма для создания/редактирования статуса"""

    class Meta:
        model = Status
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}


class TransactionTypeForm(forms.ModelForm):
    """Форма для создания/редактирования типа операции"""

    class Meta:
        model = TransactionType
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}


class CategoryForm(forms.ModelForm):
    """Форма для создания/редактирования категории"""

    class Meta:
        model = Category
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}


class SubcategoryForm(forms.ModelForm):
    """Форма для создания/редактирования подкатегории"""

    class Meta:
        model = Subcategory
        fields = ['category', 'name']
        widgets = {
            'category': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        category_field = cast('ModelChoiceField', self.fields['category'])
        category_field.queryset = Category.objects.filter(is_active=True)
