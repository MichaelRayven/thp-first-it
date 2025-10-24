import structlog
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from .forms import (
    CashFlowRecordForm,
    CategoryForm,
    StatusForm,
    SubcategoryForm,
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
    return render(request, 'transfers/index.html', context)


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
        'transfers/record_form.html',
        {'form': form},
    )


def record_edit(request: HttpRequest, pk: int) -> HttpResponse:
    """Страница редактирования записи ДДС"""
    record = get_object_or_404(CashFlowRecord, pk=pk)

    if request.method == 'POST':
        form = CashFlowRecordForm(request.POST, instance=record)
        if form.is_valid():
            form.save()
            messages.success(request, 'Запись ДДС успешно обновлена!')
            return redirect('transfers:index')
    else:
        form = CashFlowRecordForm(instance=record)

    return render(
        request,
        'transfers/record_form.html',
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

    return render(request, 'transfers/record_confirm_delete.html', {'record': record})


def reference_management(request: HttpRequest) -> HttpResponse:
    """Страница управления справочниками"""
    context = {
        'statuses': Status.objects.all(),
        'transaction_types': TransactionType.objects.all(),
        'categories': Category.objects.all(),
        'subcategories': Subcategory.objects.select_related('category').all(),
    }
    return render(request, 'transfers/reference_management.html', context)


# AJAX endpoints
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


# CRUD views for reference data
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
        'transfers/status_form.html',
        {'form': form, 'title': 'Создание статуса'},
    )


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
        'transfers/category_form.html',
        {'form': form, 'title': 'Создание категории'},
    )


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
        'transfers/subcategory_form.html',
        {
            'form': form,
            'title': 'Создание подкатегории',
            'categories': Category.objects.filter(is_active=True),
        },
    )
