import structlog
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from .forms import (
    CashFlowRecordForm,
    CategoryForm,
    StatusForm,
    SubcategoryForm,
    TransactionTypeForm,
)
from .models import (
    CashFlowRecord,
    Category,
    Status,
    Subcategory,
    TransactionType,
)

logger = structlog.get_logger(__name__)


def index(request: HttpRequest) -> HttpResponse:
    """Главная страница с таблицей записей ДДС и фильтрами"""
    records = (
        CashFlowRecord.objects.filter(is_active=True)
        .select_related('status', 'transaction_type', 'category', 'subcategory')
        .order_by('-created_at')
    )

    # Фильтры
    status_filter = request.GET.get('status')
    transaction_type_filter = request.GET.get('transaction_type')
    category_filter = request.GET.get('category')
    subcategory_filter = request.GET.get('subcategory')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')

    if status_filter:
        records = records.filter(status_id=status_filter)
    if transaction_type_filter:
        records = records.filter(transaction_type_id=transaction_type_filter)
    if category_filter:
        records = records.filter(category_id=category_filter)
    if subcategory_filter:
        records = records.filter(subcategory_id=subcategory_filter)
    if date_from:
        records = records.filter(created_at__date__gte=date_from)
    if date_to:
        records = records.filter(created_at__date__lte=date_to)

    # Пагинация
    paginator = Paginator(records, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Данные для фильтров
    statuses = Status.objects.filter(is_active=True)
    transaction_types = TransactionType.objects.filter(is_active=True)
    categories = Category.objects.filter(is_active=True)
    subcategories = Subcategory.objects.filter(is_active=True)

    context = {
        'page_obj': page_obj,
        'statuses': statuses,
        'transaction_types': transaction_types,
        'categories': categories,
        'subcategories': subcategories,
        'current_filters': {
            'status': status_filter,
            'transaction_type': transaction_type_filter,
            'category': category_filter,
            'subcategory': subcategory_filter,
            'date_from': date_from,
            'date_to': date_to,
        },
    }
    return render(request, 'index.html', context)


def reference_management(request: HttpRequest) -> HttpResponse:
    """Страница управления справочниками"""
    context = {
        'statuses': Status.objects.all(),
        'transaction_types': TransactionType.objects.all(),
        'categories': Category.objects.all(),
        'subcategories': Subcategory.objects.select_related('category').all(),
    }
    return render(request, 'reference_management.html', context)


@require_http_methods(['GET'])
def get_subcategories(request: HttpRequest) -> JsonResponse:
    """AJAX endpoint для получения подкатегорий по категории"""
    category_id = request.GET.get('category_id')
    if not category_id:
        return JsonResponse({'subcategories': []})

    try:
        subcategories = Subcategory.objects.filter(category_id=category_id, is_active=True).values(
            'id',
            'name',
        )
        return JsonResponse({'subcategories': list(subcategories)})
    except Exception:  # noqa: BLE001
        return JsonResponse({'subcategories': []})


# Управление записями ДДС
def record_create(request: HttpRequest) -> HttpResponse:
    """Страница создания записи ДДС"""

    if request.method == 'POST':
        form = CashFlowRecordForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Запись ДДС успешно создана!')
            return redirect('transfers:index')
    else:
        form = CashFlowRecordForm()

    return render(
        request,
        'cash-flow-record/record_form.html',
        {'form': form, 'title': 'Создание записи ДДС'},
    )


def record_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Страница редактирования записи ДДС"""
    record = get_object_or_404(CashFlowRecord, pk=pk)

    if request.method == 'POST':
        form = CashFlowRecordForm(request.POST, instance=record)
        if form.is_valid():
            try:
                form.save()
                messages.success(request, 'Запись ДДС успешно обновлена!')
                return redirect('transfers:index')
            except ValidationError as e:
                for field, errors in e.error_dict.items():
                    form.add_error(field, errors)
                messages.error(request, 'Пожалуйста, исправьте ошибки в форме')
    else:
        form = CashFlowRecordForm(instance=record)

    return render(
        request,
        'cash-flow-record/record_form.html',
        {'form': form, 'title': 'Редактирование записи ДДС', 'record': record},
    )


def record_delete(request: HttpRequest, pk: int) -> HttpResponse:
    """Удаление записи ДДС"""
    record = get_object_or_404(CashFlowRecord, pk=pk)

    if request.method == 'POST':
        record.is_active = False
        record.save()
        messages.success(request, 'Запись ДДС успешно удалена!')
        return redirect('transfers:index')

    return render(request, 'cash-flow-record/record_confirm_delete.html', {'record': record})


# Управление статусами
def status_create(request: HttpRequest) -> HttpResponse:
    """Создание статуса"""
    if request.method == 'POST':
        form = StatusForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Статус успешно создан!')
            return redirect('transfers:reference_management')
    else:
        form = StatusForm()

    return render(
        request,
        'status_form.html',
        {'form': form, 'title': 'Создание статуса'},
    )


def status_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Редактирование статуса"""
    status = get_object_or_404(Status, pk=pk)

    if request.method == 'POST':
        form = StatusForm(request.POST, instance=status)
        if form.is_valid():
            form.save()
            messages.success(request, 'Статус успешно обновлен!')
            return redirect('transfers:reference_management')
    else:
        form = StatusForm(instance=status)

    return render(
        request,
        'status/status_form.html',
        {'form': form, 'title': 'Редактирование статуса', 'status': status},
    )


def status_delete(request: HttpRequest, pk: int) -> HttpResponse:
    """Удаление статуса"""
    status = get_object_or_404(Status, pk=pk)

    if request.method == 'POST':
        status.is_active = False
        status.save()
        messages.success(request, 'Статус успешно удален!')
        return redirect('transfers:reference_management')

    return render(
        request,
        'status/status_confirm_delete.html',
        {'status': status},
    )


def status_enable(request: HttpRequest, pk: int) -> HttpResponse:
    """Включение статуса"""
    status = get_object_or_404(Status, pk=pk)
    status.is_active = True
    status.save()
    messages.success(request, 'Статус успешно включен!')
    return redirect('transfers:reference_management')


# Управление типами операций
def transaction_type_create(request: HttpRequest) -> HttpResponse:
    """Создание типа операции"""
    if request.method == 'POST':
        form = TransactionTypeForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Тип операции успешно создан!')
            return redirect('transfers:reference_management')
    else:
        form = TransactionTypeForm()

    return render(
        request,
        'transaction_type/transaction_type_form.html',
        {'form': form, 'title': 'Создание типа операции'},
    )


def transaction_type_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Редактирование типа операции"""
    transaction_type = get_object_or_404(TransactionType, pk=pk)

    if request.method == 'POST':
        form = TransactionTypeForm(request.POST, instance=transaction_type)
        if form.is_valid():
            form.save()
            messages.success(request, 'Тип операции успешно обновлен!')
            return redirect('transfers:reference_management')
    else:
        form = TransactionTypeForm(instance=transaction_type)

    return render(
        request,
        'transaction_type/transaction_type_form.html',
        {
            'form': form,
            'title': 'Редактирование типа операции',
            'transaction_type': transaction_type,
        },
    )


def transaction_type_delete(request: HttpRequest, pk: int) -> HttpResponse:
    """Удаление типа операции"""
    transaction_type = get_object_or_404(TransactionType, pk=pk)

    if request.method == 'POST':
        transaction_type.is_active = False
        transaction_type.save()
        messages.success(request, 'Тип операции успешно удален!')
        return redirect('transfers:reference_management')

    return render(
        request,
        'transaction_type/transaction_type_confirm_delete.html',
        {'transaction_type': transaction_type},
    )


def transaction_type_enable(request: HttpRequest, pk: int) -> HttpResponse:
    """Включение типа операции"""
    transaction_type = get_object_or_404(TransactionType, pk=pk)
    transaction_type.is_active = True
    transaction_type.save()
    messages.success(request, 'Тип операции успешно включен!')
    return redirect('transfers:reference_management')


# Управление категориями
def category_create(request: HttpRequest) -> HttpResponse:
    """Создание категории"""
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Категория успешно создана!')
            return redirect('transfers:reference_management')
    else:
        form = CategoryForm()

    return render(
        request,
        'category_form.html',
        {'form': form, 'title': 'Создание категории'},
    )


def category_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Редактирование категории"""
    category = get_object_or_404(Category, pk=pk)

    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, 'Категория успешно обновлена!')
            return redirect('transfers:reference_management')
    else:
        form = CategoryForm(instance=category)

    return render(
        request,
        'category/category_form.html',
        {'form': form, 'title': 'Редактирование категории', 'category': category},
    )


def category_delete(request: HttpRequest, pk: int) -> HttpResponse:
    """Удаление категории"""
    category = get_object_or_404(Category, pk=pk)

    if request.method == 'POST':
        category.is_active = False
        category.save()
        messages.success(request, 'Категория успешно удалена!')
        return redirect('transfers:reference_management')

    return render(
        request,
        'category/category_confirm_delete.html',
        {'category': category},
    )


def category_enable(request: HttpRequest, pk: int) -> HttpResponse:
    """Включение категории"""
    category = get_object_or_404(Category, pk=pk)
    category.is_active = True
    category.save()
    messages.success(request, 'Категория успешно включена!')
    return redirect('transfers:reference_management')


# Управление подкатегориями
def subcategory_create(request: HttpRequest) -> HttpResponse:
    """Создание подкатегории"""
    if request.method == 'POST':
        form = SubcategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Подкатегория успешно создана!')
            return redirect('transfers:reference_management')
    else:
        form = SubcategoryForm()

    return render(
        request,
        'subcategory/subcategory_form.html',
        {
            'form': form,
            'title': 'Создание подкатегории',
            'categories': Category.objects.filter(is_active=True),
        },
    )


def subcategory_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Редактирование подкатегории"""
    subcategory = get_object_or_404(Subcategory, pk=pk)

    if request.method == 'POST':
        form = SubcategoryForm(request.POST, instance=subcategory)
        if form.is_valid():
            form.save()
            messages.success(request, 'Подкатегория успешно обновлена!')
            return redirect('transfers:reference_management')
    else:
        form = SubcategoryForm(instance=subcategory)

    return render(
        request,
        'subcategory/subcategory_form.html',
        {
            'form': form,
            'title': 'Редактирование подкатегории',
            'subcategory': subcategory,
            'categories': Category.objects.filter(is_active=True),
        },
    )


def subcategory_delete(request: HttpRequest, pk: int) -> HttpResponse:
    """Удаление подкатегории"""
    subcategory = get_object_or_404(Subcategory, pk=pk)

    if request.method == 'POST':
        subcategory.is_active = False
        subcategory.save()
        messages.success(request, 'Подкатегория успешно удалена!')
        return redirect('transfers:reference_management')

    return render(
        request,
        'subcategory/subcategory_confirm_delete.html',
        {'subcategory': subcategory},
    )


def subcategory_enable(request: HttpRequest, pk: int) -> HttpResponse:
    """Включение подкатегории"""
    subcategory = get_object_or_404(Subcategory, pk=pk)
    subcategory.is_active = True
    subcategory.save()
    messages.success(request, 'Подкатегория успешно включена!')
    return redirect('transfers:reference_management')
