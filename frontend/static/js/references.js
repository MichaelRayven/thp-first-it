$(document).ready(function() {
    // Загрузка всех списков данных
    loadStatuses();
    loadTransactionTypes();
    loadCategories();
    loadSubcategories();

    $("#saveStatus").click(function() {
        saveStatus();
    });

    $("#saveTransactionType").click(function() {
        saveTransactionType();
    });

    $("#saveCategory").click(function() {
        saveCategory();
    });

    $("#saveSubcategory").click(function() {
        saveSubcategory();
    });

    // Category change handler for subcategory modal
    $("#subcategoryCategory").change(function() {
        const selectedCategoryId = $(this).val();
        loadSubcategoriesForModal(selectedCategoryId);
    });
});

// Global variable to track current editing ID
CommonUtils.currentEditingId = null;

// Status functions
function loadStatuses() {
    $.ajax({
        url: "/api/statuses/",
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#statusTableBody").html(
                data.results.map(status => `
                    <tr>
                        <td>${status.name}</td>
                        <td>
                            <span class="badge ${status.is_active ? 'bg-success' : 'bg-secondary'}">
                                ${status.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editStatus(${status.id})" data-bs-toggle="modal" data-bs-target="#statusModal">
                                <i class="fas fa-edit"></i>
                            </button>

                            ${!status.is_active ?
                              `<button class="btn btn-success btn-sm" onclick="enableStatus(${status.id})"><i class="fas fa-check"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteStatus(${status.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading statuses:", error);
            CommonUtils.showToast('Ошибка при загрузке статусов', 'error');
        },
    });
}

function editStatus(id) {
    CommonUtils.currentEditingId = id;
    $.ajax({
        url: `/api/statuses/${id}/`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#statusModalTitle").text("Редактирование статуса");
            $("#statusName").val(data.name);
        },
        error: function (xhr, status, error) {
            console.log("Error loading status:", error);
            showToast('Ошибка при загрузке статуса', 'error');
        },
    });
}

function saveStatus() {
    try {
        const formData = { name: $("#statusName").val().trim() };
        clearFormErrors('statusForm');

        if (!formData.name) {
            showFieldError('statusNameError', 'Название обязательно для заполнения');
            return;
        }

        if (CommonUtils.currentEditingId) {
            $.ajax({
                url: `/api/statuses/${CommonUtils.currentEditingId}/`,
                type: "PUT",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Статус успешно обновлен', 'success');
                    CommonUtils.hideModal('statusModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'statusForm');
                    showToast('Ошибка при обновлении статуса', 'error');
                },
            });
        } else {
            $.ajax({
                url: "/api/statuses/",
                type: "POST",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Статус успешно создан', 'success');
                    CommonUtils.hideModal('statusModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'statusForm');
                    showToast('Ошибка при создании статуса', 'error');
                },
            });
        }
    } catch (error) {
        showToast('Ошибка при сохранении статуса', 'error');
    }
}

function deleteStatus(id) {
    if (confirm('Вы уверены, что хотите удалить этот статус?')) {
        $.ajax({
            url: `/api/statuses/${id}/`,
            type: "DELETE",
            success: function () {
                showToast('Статус успешно удален', 'success');
                loadAllReferenceData();
            },
            error: function (xhr, status, error) {
                console.log("Error deleting status:", error);
                showToast('Ошибка при удалении статуса', 'error');
            },
        });
    }
}

function enableStatus(id) {
    $.ajax({
        url: `/api/statuses/${id}/enable/`,
        type: "POST",
        success: function () {
            showToast('Статус успешно включен', 'success');
            loadAllReferenceData();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling status:", error);
            showToast('Ошибка при включении статуса', 'error');
        },
    });
}

// Transaction Type functions
function loadTransactionTypes() {
    $.ajax({
        url: "/api/transaction-types/",
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#transactionTypeTableBody").html(
                data.results.map(transactionType => `
                    <tr>
                        <td>${transactionType.name}</td>
                        <td>
                            <span class="badge ${transactionType.is_active ? 'bg-success' : 'bg-secondary'}">
                                ${transactionType.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editTransactionType(${transactionType.id})" data-bs-toggle="modal" data-bs-target="#transactionTypeModal">
                                <i class="fas fa-edit"></i>
                            </button>

                            ${!transactionType.is_active ?
                              `<button class="btn btn-success btn-sm" onclick="enableTransactionType(${transactionType.id})"><i class="fas fa-check"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteTransactionType(${transactionType.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading transaction types:", error);
            showToast('Ошибка при загрузке типов операций', 'error');
        },
    });
}

function editTransactionType(id) {
    CommonUtils.currentEditingId = id;
    $.ajax({
        url: `/api/transaction-types/${id}/`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#transactionTypeModalTitle").text("Редактирование типа операции");
            $("#transactionTypeName").val(data.name);
        },
        error: function (xhr, status, error) {
            console.log("Error loading transaction type:", error);
            showToast('Ошибка при загрузке типа операции', 'error');
        },
    });
}

function saveTransactionType() {
    try {
        const formData = { name: $("#transactionTypeName").val().trim() };
        clearFormErrors('transactionTypeForm');

        if (!formData.name) {
            showFieldError('transactionTypeNameError', 'Название обязательно для заполнения');
            return;
        }

        if (CommonUtils.currentEditingId) {
            $.ajax({
                url: `/api/transaction-types/${CommonUtils.currentEditingId}/`,
                type: "PUT",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Тип операции успешно обновлен', 'success');
                    CommonUtils.hideModal('transactionTypeModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'transactionTypeForm');
                    showToast('Ошибка при обновлении типа операции', 'error');
                },
            });
        } else {
            $.ajax({
                url: "/api/transaction-types/",
                type: "POST",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Тип операции успешно создан', 'success');
                    CommonUtils.hideModal('transactionTypeModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'transactionTypeForm');
                    showToast('Ошибка при создании типа операции', 'error');
                },
            });
        }
    } catch (error) {
        showToast('Ошибка при сохранении типа операции', 'error');
    }
}

function deleteTransactionType(id) {
    if (confirm('Вы уверены, что хотите удалить этот тип операции?')) {
        $.ajax({
            url: `/api/transaction-types/${id}/`,
            type: "DELETE",
            success: function () {
                showToast('Тип операции успешно удален', 'success');
                loadAllReferenceData();
            },
            error: function (xhr, status, error) {
                console.log("Error deleting transaction type:", error);
                showToast('Ошибка при удалении типа операции', 'error');
            },
        });
    }
}

function enableTransactionType(id) {
    $.ajax({
        url: `/api/transaction-types/${id}/enable/`,
        type: "POST",
        success: function () {
            showToast('Тип операции успешно включен', 'success');
            loadAllReferenceData();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling transaction type:", error);
            showToast('Ошибка при включении типа операции', 'error');
        },
    });
}

// Category functions
function loadCategories() {
    $.ajax({
        url: "/api/categories/",
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#categoryTableBody").html(
                data.results.map(category => `
                    <tr>
                        <td>${category.name}</td>
                        <td>
                            <span class="badge ${category.is_active ? 'bg-success' : 'bg-secondary'}">
                                ${category.is_active ? 'Активна' : 'Неактивна'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editCategory(${category.id})" data-bs-toggle="modal" data-bs-target="#categoryModal">
                                <i class="fas fa-edit"></i>
                            </button>

                            ${!category.is_active ? `<button class="btn btn-success btn-sm" onclick="enableCategory(${category.id})"><i class="fas fa-check"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading categories:", error);
            showToast('Ошибка при загрузке категорий', 'error');
        },
    });
}

function editCategory(id) {
    CommonUtils.currentEditingId = id;
    $.ajax({
        url: `/api/categories/${id}/`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#categoryModalTitle").text("Редактирование категории");
            $("#categoryName").val(data.name);
        },
        error: function (xhr, status, error) {
            console.log("Error loading category:", error);
            showToast('Ошибка при загрузке категории', 'error');
        },
    });
}

function saveCategory() {
    try {
        const formData = { name: $("#categoryName").val().trim() };
        clearFormErrors('categoryForm');

        if (!formData.name) {
            showFieldError('categoryNameError', 'Название обязательно для заполнения');
            return;
        }

        if (CommonUtils.currentEditingId) {
            $.ajax({
                url: `/api/categories/${CommonUtils.currentEditingId}/`,
                type: "PUT",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Категория успешно обновлена', 'success');
                    CommonUtils.hideModal('categoryModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'categoryForm');
                    showToast('Ошибка при обновлении категории', 'error');
                },
            });
        } else {
            $.ajax({
                url: "/api/categories/",
                type: "POST",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Категория успешно создана', 'success');
                    CommonUtils.hideModal('categoryModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'categoryForm');
                    showToast('Ошибка при создании категории', 'error');
                },
            });
        }
    } catch (error) {
        showToast('Ошибка при сохранении категории', 'error');
    }
}

function deleteCategory(id) {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
        $.ajax({
            url: `/api/categories/${id}/`,
            type: "DELETE",
            success: function () {
                showToast('Категория успешно удалена', 'success');
                loadAllReferenceData();
            },
            error: function (xhr, status, error) {
                console.log("Error deleting category:", error);
                showToast('Ошибка при удалении категории', 'error');
            },
        });
    }
}

function enableCategory(id) {
    $.ajax({
        url: `/api/categories/${id}/enable/`,
        type: "POST",
        success: function () {
            showToast('Категория успешно включена', 'success');
            loadAllReferenceData();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling category:", error);
            showToast('Ошибка при включении категории', 'error');
        },
    });
}

// Subcategory functions
function loadSubcategories() {
    $.ajax({
        url: "/api/subcategories/",
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#subcategoryTableBody").html(
                data.results.map(subcategory => `
                    <tr>
                        <td>${subcategory.category.name}</td>
                        <td>${subcategory.name}</td>
                        <td>
                            <span class="badge ${subcategory.is_active ? 'bg-success' : 'bg-secondary'}">
                                ${subcategory.is_active ? 'Активна' : 'Неактивна'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editSubcategory(${subcategory.id})" data-bs-toggle="modal" data-bs-target="#subcategoryModal">
                                <i class="fas fa-edit"></i>
                            </button>

                            ${!subcategory.is_active ?
                              `<button class="btn btn-success btn-sm" onclick="enableSubcategory(${subcategory.id})"><i class="fas fa-check"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteSubcategory(${subcategory.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading subcategories:", error);
            showToast('Ошибка при загрузке подкатегорий', 'error');
        },
    });
}

function editSubcategory(id) {
    CommonUtils.currentEditingId = id;
    $.ajax({
        url: `/api/subcategories/${id}/`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            $("#subcategoryModalTitle").text("Редактирование подкатегории");
            $("#subcategoryName").val(data.name);

            // Load categories for the dropdown
            CommonUtils.loadCategoriesForModal(data.category.id);
        },
        error: function (xhr, status, error) {
            console.log("Error loading subcategory:", error);
            showToast('Ошибка при загрузке подкатегории', 'error');
        },
    });
}

function saveSubcategory() {
    try {
        const formData = {
            category_id: parseInt($("#subcategoryCategory").val()),
            name: $("#subcategoryName").val().trim()
        };
        clearFormErrors('subcategoryForm');

        if (!formData.category_id) {
            showFieldError('subcategoryCategoryError', 'Категория обязательна для заполнения');
            return;
        }
        if (!formData.name) {
            showFieldError('subcategoryNameError', 'Название обязательно для заполнения');
            return;
        }

        if (CommonUtils.currentEditingId) {
            $.ajax({
                url: `/api/subcategories/${CommonUtils.currentEditingId}/`,
                type: "PUT",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Подкатегория успешно обновлена', 'success');
                    CommonUtils.hideModal('subcategoryModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'subcategoryForm');
                    showToast('Ошибка при обновлении подкатегории', 'error');
                },
            });
        } else {
            $.ajax({
                url: "/api/subcategories/",
                type: "POST",
                data: JSON.stringify(formData),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: function (data) {
                    showToast('Подкатегория успешно создана', 'success');
                    CommonUtils.hideModal('subcategoryModal');
                    loadAllReferenceData();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'subcategoryForm');
                    showToast('Ошибка при создании подкатегории', 'error');
                },
            });
        }
    } catch (error) {
        showToast('Ошибка при сохранении подкатегории', 'error');
    }
}

function deleteSubcategory(id) {
    if (confirm('Вы уверены, что хотите удалить эту подкатегорию?')) {
        $.ajax({
            url: `/api/subcategories/${id}/`,
            type: "DELETE",
            success: function () {
                showToast('Подкатегория успешно удалена', 'success');
                loadAllReferenceData();
            },
            error: function (xhr, status, error) {
                console.log("Error deleting subcategory:", error);
                showToast('Ошибка при удалении подкатегории', 'error');
            },
        });
    }
}

function enableSubcategory(id) {
    $.ajax({
        url: `/api/subcategories/${id}/enable/`,
        type: "POST",
        success: function () {
            showToast('Подкатегория успешно включена', 'success');
            loadAllReferenceData();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling subcategory:", error);
            showToast('Ошибка при включении подкатегории', 'error');
        },
    });
}

function loadSubcategoriesForModal(categoryId) {
    if (!categoryId) {
        return;
    }

    $.ajax({
        url: `/api/subcategories/?category=${categoryId}&is_active=true`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            // This function is for future use if needed
            console.log("Subcategories loaded for category:", categoryId);
        },
        error: function (xhr, status, error) {
            console.log("Error loading subcategories for modal:", error);
        },
    });
}

function clearFormErrors(formId) {
    $(`#${formId} .error-message`).text('');
    $(`#${formId} .form-control, #${formId} .form-select`).removeClass('is-invalid');
}

function showFieldError(errorElementId, message) {
    $(`#${errorElementId}`).text(message);
    $(`#${errorElementId}`).prev().addClass('is-invalid');
}

function getFieldErrorId(field) {
    const fieldMap = {
        'name': 'statusNameError',
        'transaction_type_name': 'transactionTypeNameError',
        'category_name': 'categoryNameError',
        'subcategory_name': 'subcategoryNameError',
        'category': 'subcategoryCategoryError'
    };
    return fieldMap[field] || null;
}

function hideModal(modalId) {
    $(`#${modalId}`).modal('hide');
    // Reset form and editing state
    $(`#${modalId} form`)[0].reset();
    CommonUtils.currentEditingId = null;

    // Reset modal titles
    if (modalId === 'statusModal') {
        $("#statusModalTitle").text("Создание статуса");
    } else if (modalId === 'transactionTypeModal') {
        $("#transactionTypeModalTitle").text("Создание типа операции");
    } else if (modalId === 'categoryModal') {
        $("#categoryModalTitle").text("Создание категории");
    } else if (modalId === 'subcategoryModal') {
        $("#subcategoryModalTitle").text("Создание подкатегории");
        CommonUtils.loadCategoriesForModal(); // Reset category dropdown
    }
}

function showToast(message, type = 'info') {
    // Create toast if it doesn't exist
    if (!$('#toast').length) {
        $('body').append(`
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div id="toast" class="toast bg-light text-bg-light" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">Уведомление</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body" id="toastBody"></div>
                </div>
            </div>
        `);
    }

    $('#toastBody').text(message);
    $('#toast').removeClass('bg-success bg-danger bg-info');

    if (type === 'success') {
        $('#toast').addClass('bg-success text-white');
    } else if (type === 'error') {
        $('#toast').addClass('bg-danger text-white');
    } else {
        $('#toast').addClass('bg-info text-white');
    }

    const toast = new bootstrap.Toast(document.getElementById('toast'));
    toast.show();
}
