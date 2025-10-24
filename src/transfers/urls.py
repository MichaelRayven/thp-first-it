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
    path('category/create/', views.category_create, name='category_create'),
    path('subcategory/create/', views.subcategory_create, name='subcategory_create'),
    # AJAX endpoints
    path('ajax/get-subcategories/', views.get_subcategories, name='get_subcategories'),
]
