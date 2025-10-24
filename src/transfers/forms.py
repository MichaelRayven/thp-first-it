from typing import TYPE_CHECKING, Any, cast

from django import forms
from django.core.exceptions import ValidationError

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
            'comment': forms.Textarea(
                attrs={'rows': 3, 'class': 'form-control'},
            ),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'transaction_type': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'subcategory': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        self.configure_error_messages()
        self.configure_querysets()

    def configure_error_messages(self) -> None:
        self.fields['status'].error_messages = {'required': 'Статус обязателен для заполнения'}
        self.fields['transaction_type'].error_messages = {
            'required': 'Тип операции обязателен для заполнения',
        }
        self.fields['category'].error_messages = {
            'required': 'Категория обязательна для заполнения',
        }
        self.fields['subcategory'].error_messages = {
            'required': 'Подкатегория обязательна для заполнения',
            'invalid_choice': 'Выбранная подкатегория не существует или неактивна',
        }
        self.fields['amount'].error_messages = {'required': 'Сумма обязательна для заполнения'}
        self.fields['comment'].error_messages = {
            'required': 'Комментарий обязателен для заполнения',
        }

    def configure_querysets(self) -> None:
        cast('ModelChoiceField', self.fields['status']).queryset = Status.objects.filter(
            is_active=True,
        )
        cast(
            'ModelChoiceField',
            self.fields['transaction_type'],
        ).queryset = TransactionType.objects.filter(is_active=True)
        cast('ModelChoiceField', self.fields['category']).queryset = Category.objects.filter(
            is_active=True,
        )

        category_id = None
        if self.data and 'category' in self.data:
            # Если выбрана категория, показываем подкатегории
            category_id = self.data.get('category')
        elif self.instance.pk and self.instance.category:
            # Если редактируем существующую запись используем текущую категорию
            category_id = self.instance.category.id

        cast('ModelChoiceField', self.fields['subcategory']).queryset = (
            Subcategory.objects.filter(
                category_id=category_id,
                is_active=True,
            )
            if category_id
            else Subcategory.objects.none()
        )

    def clean_subcategory(self) -> Subcategory:
        subcategory: Subcategory = self.cleaned_data.get('subcategory', False)
        category: Category = self.cleaned_data.get('category', False)

        if subcategory.category != category:
            raise ValidationError(
                {'subcategory': 'Подкатегория должна принадлежать выбранной категории'},
            )

        return subcategory

    def clean_amount(self) -> float:
        amount: float = self.cleaned_data.get('amount', False)
        if not amount or amount <= 0:
            raise ValidationError({'amount': 'Сумма должна быть больше 0'})
        return amount


class StatusForm(forms.ModelForm):
    """Форма для создания/редактирования статуса"""

    class Meta:
        model = Status
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        self.fields['name'].error_messages = {'required': 'Название обязательно для заполнения'}


class TransactionTypeForm(forms.ModelForm):
    """Форма для создания/редактирования типа операции"""

    class Meta:
        model = TransactionType
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        self.fields['name'].error_messages = {'required': 'Название обязательно для заполнения'}


class CategoryForm(forms.ModelForm):
    """Форма для создания/редактирования категории"""

    class Meta:
        model = Category
        fields = ['name']
        widgets = {'name': forms.TextInput(attrs={'class': 'form-control'})}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        self.fields['name'].error_messages = {'required': 'Название обязательно для заполнения'}


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

        self.fields['name'].error_messages = {'required': 'Название обязательно для заполнения'}
        self.fields['category'].error_messages = {
            'required': 'Категория обязательна для заполнения',
        }
