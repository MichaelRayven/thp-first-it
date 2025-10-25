$(document).ready(function() {
    // Loading all references
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
                              `<button class="btn btn-success btn-sm" onclick="enableStatus(${status.id})"><i class="fas fa-plus"></i></button>` :
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
            CommonUtils.showToast('Ошибка при загрузке статуса', 'error');
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
                    CommonUtils.showToast('Статус успешно обновлен', 'success');
                    CommonUtils.hideModal('statusModal');
                    loadStatuses();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'statusForm');
                    CommonUtils.showToast('Ошибка при обновлении статуса', 'error');
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
                    CommonUtils.showToast('Статус успешно создан', 'success');
                    CommonUtils.hideModal('statusModal');
                    loadStatuses();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'statusForm');
                    CommonUtils.showToast('Ошибка при создании статуса', 'error');
                },
            });
        }
    } catch (error) {
        CommonUtils.showToast('Ошибка при сохранении статуса', 'error');
    }
}

function deleteStatus(id) {
    $.ajax({
        url: `/api/statuses/${id}/`,
        type: "DELETE",
        success: function () {
            CommonUtils.showToast('Статус успешно удален', 'success');
            loadStatuses();
        },
        error: function (xhr, status, error) {
            console.log("Error deleting status:", error);
            CommonUtils.showToast('Ошибка при удалении статуса', 'error');
        },
    });
}

function enableStatus(id) {
    $.ajax({
        url: `/api/statuses/${id}/enable/`,
        type: "POST",
        success: function () {
            CommonUtils.showToast('Статус успешно включен', 'success');
            loadStatuses();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling status:", error);
            CommonUtils.showToast('Ошибка при включении статуса', 'error');
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
                              `<button class="btn btn-success btn-sm" onclick="enableTransactionType(${transactionType.id})"><i class="fas fa-plus"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteTransactionType(${transactionType.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading transaction types:", error);
            CommonUtils.showToast('Ошибка при загрузке типов операций', 'error');
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
            CommonUtils.showToast('Ошибка при загрузке типа операции', 'error');
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
                    CommonUtils.showToast('Тип операции успешно обновлен', 'success');
                    CommonUtils.hideModal('transactionTypeModal');
                    loadTransactionTypes();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'transactionTypeForm');
                    CommonUtils.showToast('Ошибка при обновлении типа операции', 'error');
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
                    CommonUtils.showToast('Тип операции успешно создан', 'success');
                    CommonUtils.hideModal('transactionTypeModal');
                    loadTransactionTypes();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'transactionTypeForm');
                    CommonUtils.showToast('Ошибка при создании типа операции', 'error');
                },
            });
        }
    } catch (error) {
        CommonUtils.showToast('Ошибка при сохранении типа операции', 'error');
    }
}

function deleteTransactionType(id) {
    $.ajax({
        url: `/api/transaction-types/${id}/`,
        type: "DELETE",
        success: function () {
            CommonUtils.showToast('Тип операции успешно удален', 'success');
            loadTransactionTypes();
        },
        error: function (xhr, status, error) {
            console.log("Error deleting transaction type:", error);
            CommonUtils.showToast('Ошибка при удалении типа операции', 'error');
        },
    });
}

function enableTransactionType(id) {
    $.ajax({
        url: `/api/transaction-types/${id}/enable/`,
        type: "POST",
        success: function () {
            CommonUtils.showToast('Тип операции успешно включен', 'success');
            loadTransactionTypes();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling transaction type:", error);
            CommonUtils.showToast('Ошибка при включении типа операции', 'error');
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

                            ${!category.is_active ? `<button class="btn btn-success btn-sm" onclick="enableCategory(${category.id})"><i class="fas fa-plus"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading categories:", error);
            CommonUtils.showToast('Ошибка при загрузке категорий', 'error');
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
            CommonUtils.showToast('Ошибка при загрузке категории', 'error');
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
                    CommonUtils.showToast('Категория успешно обновлена', 'success');
                    CommonUtils.hideModal('categoryModal');
                    loadCategories();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'categoryForm');
                    CommonUtils.showToast('Ошибка при обновлении категории', 'error');
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
                    CommonUtils.showToast('Категория успешно создана', 'success');
                    CommonUtils.hideModal('categoryModal');
                    loadCategories();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'categoryForm');
                    CommonUtils.showToast('Ошибка при создании категории', 'error');
                },
            });
        }
    } catch (error) {
        CommonUtils.showToast('Ошибка при сохранении категории', 'error');
    }
}

function deleteCategory(id) {
    $.ajax({
        url: `/api/categories/${id}/`,
        type: "DELETE",
        success: function () {
            CommonUtils.showToast('Категория успешно удалена', 'success');
            loadCategories();
        },
        error: function (xhr, status, error) {
            console.log("Error deleting category:", error);
            CommonUtils.showToast('Ошибка при удалении категории', 'error');
        },
    });
}

function enableCategory(id) {
    $.ajax({
        url: `/api/categories/${id}/enable/`,
        type: "POST",
        success: function () {
            CommonUtils.showToast('Категория успешно включена', 'success');
            loadCategories();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling category:", error);
            CommonUtils.showToast('Ошибка при включении категории', 'error');
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
                              `<button class="btn btn-success btn-sm" onclick="enableSubcategory(${subcategory.id})"><i class="fas fa-plus"></i></button>` :
                              `<button class="btn btn-danger btn-sm" onclick="deleteSubcategory(${subcategory.id})"><i class="fas fa-trash"></i></button>`}
                        </td>
                    </tr>
                `).join("")
            );
        },
        error: function (xhr, status, error) {
            console.log("Error loading subcategories:", error);
            CommonUtils.showToast('Ошибка при загрузке подкатегорий', 'error');
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
            CommonUtils.showToast('Ошибка при загрузке подкатегории', 'error');
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
                    CommonUtils.showToast('Подкатегория успешно обновлена', 'success');
                    CommonUtils.hideModal('subcategoryModal');
                    loadSubcategories();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'subcategoryForm');
                    CommonUtils.showToast('Ошибка при обновлении подкатегории', 'error');
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
                    CommonUtils.showToast('Подкатегория успешно создана', 'success');
                    CommonUtils.hideModal('subcategoryModal');
                    loadSubcategories();
                },
                error: function (xhr, status, error) {
                    CommonUtils.handleFormErrors(xhr, 'subcategoryForm');
                    CommonUtils.showToast('Ошибка при создании подкатегории', 'error');
                },
            });
        }
    } catch (error) {
        showToast('Ошибка при сохранении подкатегории', 'error');
    }
}

function deleteSubcategory(id) {
    $.ajax({
        url: `/api/subcategories/${id}/`,
        type: "DELETE",
        success: function () {
            CommonUtils.showToast('Подкатегория успешно удалена', 'success');
            loadSubcategories();
        },
        error: function (xhr, status, error) {
            console.log("Error deleting subcategory:", error);
            CommonUtils.showToast('Ошибка при удалении подкатегории', 'error');
        },
    });
}

function enableSubcategory(id) {
    $.ajax({
        url: `/api/subcategories/${id}/enable/`,
        type: "POST",
        success: function () {
            CommonUtils.showToast('Подкатегория успешно включена', 'success');
            loadSubcategories();
        },
        error: function (xhr, status, error) {
            console.log("Error enabling subcategory:", error);
            CommonUtils.showToast('Ошибка при включении подкатегории', 'error');
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
