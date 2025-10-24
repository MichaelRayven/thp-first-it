from django.urls import path

from . import views

app_name = 'transfers'

urlpatterns = [
    # Основные страницы
    path('', views.index, name='index'),
    path('record/create/', views.record_create, name='record_create'),
    path('record/<int:pk>/edit/', views.record_edit, name='record_edit'),
    path('record/<int:pk>/delete/', views.record_delete, name='record_delete'),
    # Управление справочниками
    path('reference/', views.reference_management, name='reference_management'),
    path('status/create/', views.status_create, name='status_create'),
    path('status/<int:pk>/edit/', views.status_edit, name='status_edit'),
    path('status/<int:pk>/delete/', views.status_delete, name='status_delete'),
    path('transaction-type/create/', views.transaction_type_create, name='transaction_type_create'),
    path(
        'transaction-type/<int:pk>/edit/',
        views.transaction_type_edit,
        name='transaction_type_edit',
    ),
    path(
        'transaction-type/<int:pk>/delete/',
        views.transaction_type_delete,
        name='transaction_type_delete',
    ),
    path('category/create/', views.category_create, name='category_create'),
    path('category/<int:pk>/edit/', views.category_edit, name='category_edit'),
    path('category/<int:pk>/delete/', views.category_delete, name='category_delete'),
    path('subcategory/create/', views.subcategory_create, name='subcategory_create'),
    path('subcategory/<int:pk>/edit/', views.subcategory_edit, name='subcategory_edit'),
    path('subcategory/<int:pk>/delete/', views.subcategory_delete, name='subcategory_delete'),
    # AJAX endpoints
    path('ajax/get-subcategories/', views.get_subcategories, name='get_subcategories'),
]
