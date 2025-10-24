from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Manager


class Status(models.Model):
    """Статус записи ДДС (Бизнес, Личное, Налог и т.д.)"""

    objects: Manager['Status']

    name = models.CharField(max_length=100, unique=True, verbose_name='Название статуса')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Статус'
        verbose_name_plural = 'Статусы'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class TransactionType(models.Model):
    """Тип операции (Пополнение, Списание и т.д.)"""

    objects: Manager['TransactionType']

    name = models.CharField(max_length=100, unique=True, verbose_name='Название типа')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Тип операции'
        verbose_name_plural = 'Типы операций'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    """Категория расходов/доходов (Инфраструктура, Маркетинг и т.д.)"""

    objects: Manager['Category']

    name = models.CharField(max_length=100, unique=True, verbose_name='Название категории')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Subcategory(models.Model):
    """Подкатегория, связанная с основной категорией"""

    objects: Manager['Subcategory']

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories',
        verbose_name='Категория',
    )
    name = models.CharField(max_length=100, verbose_name='Название подкатегории')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Подкатегория'
        verbose_name_plural = 'Подкатегории'
        ordering = ['category__name', 'name']
        unique_together = ['category', 'name']

    def __str__(self) -> str:
        return f'{self.category.name} - {self.name}'


class CashFlowRecord(models.Model):
    objects: Manager['CashFlowRecord']

    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        verbose_name='Статус',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        verbose_name='Категория',
    )
    transaction_type = models.ForeignKey(
        TransactionType,
        on_delete=models.PROTECT,
        verbose_name='Тип операции',
    )
    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.PROTECT,
        verbose_name='Подкатегория',
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name='Сумма (руб.)',
    )
    comment = models.TextField(blank=True, default='', verbose_name='Комментарий')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Запись ДДС'
        verbose_name_plural = 'Записи ДДС'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Перевод: {self.transaction_type.name} - {self.amount} р.'
