// Common utility functions for both index and references pages
class CommonUtils {
    // Global variable to track current editing ID
    static currentEditingId = null;

    // Toast notification system
    static showToast(message, type = 'info') {
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

        const toast = new bootstrap.Toast(document.getElementById('toast'));
        toast.show();
    }

    // Form validation utilities
    static clearFormErrors(formId) {
        $(`#${formId} .error-message`).text('');
        $(`#${formId} .form-control, #${formId} .form-select`).removeClass('is-invalid');
    }

    static showFieldError(errorElementId, message) {
        $(`#${errorElementId}`).text(message);
        $(`#${errorElementId}`).prev().addClass('is-invalid');
    }

    static handleFormErrors(xhr, formId) {
        try {
            const errorData = JSON.parse(xhr.responseText);
            if (errorData && typeof errorData === 'object') {
                Object.keys(errorData).forEach(field => {
                    const errorId = this.getFieldErrorId(field);
                    if (errorId) {
                        this.showFieldError(errorId, Array.isArray(errorData[field]) ? errorData[field][0] : errorData[field]);
                    }
                });
            }
        } catch (e) {
            console.log("Error parsing error response:", e);
        }
    }

    static getFieldErrorId(field) {
        const fieldMap = {
            'name': 'statusNameError',
            'transaction_type_name': 'transactionTypeNameError',
            'category_name': 'categoryNameError',
            'subcategory_name': 'subcategoryNameError',
            'category': 'subcategoryCategoryError',
            'status': 'recordStatusError',
            'transaction_type': 'recordTransactionTypeError',
            'category': 'recordCategoryError',
            'subcategory': 'recordSubcategoryError',
            'amount': 'recordAmountError',
            'comment': 'recordCommentError'
        };
        return fieldMap[field] || null;
    }

    // Modal management
    static hideModal(modalId) {
        $(`#${modalId}`).modal('hide');
        // Reset form and editing state
        $(`#${modalId} form`)[0].reset();
        this.currentEditingId = null;

        // Reset modal titles
        if (modalId === 'statusModal') {
            $("#statusModalTitle").text("Создание статуса");
        } else if (modalId === 'transactionTypeModal') {
            $("#transactionTypeModalTitle").text("Создание типа операции");
        } else if (modalId === 'categoryModal') {
            $("#categoryModalTitle").text("Создание категории");
        } else if (modalId === 'subcategoryModal') {
            $("#subcategoryModalTitle").text("Создание подкатегории");
            this.loadCategoriesForModal(); // Reset category dropdown
        } else if (modalId === 'cashFlowRecordModal') {
            $("#cashFlowRecordModalTitle").text("Создание записи ДДС");
        }
    }

    // API utility functions
    static makeRequest(url, method = 'GET', data = null) {
        const config = {
            url: url,
            type: method,
            contentType: "application/json; charset=UTF-8",
            dataType: "json"
        };

        if (data) {
            config.data = JSON.stringify(data);
        }

        return $.ajax(config);
    }

    // Reference data loading functions
    static loadCategoriesForModal(selectedCategoryId = null) {
        return $.ajax({
            url: "/api/categories/?is_active=true",
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options = '<option value="">Выберите категорию</option>';
                options += data.results.map(category =>
                    `<option value="${category.id}" ${selectedCategoryId == category.id ? 'selected' : ''}>${category.name}</option>`
                ).join("");
                $("#subcategoryCategory").html(options);
            },
            error: function (xhr, status, error) {
                console.log("Error loading categories for modal:", error);
            },
        });
    }

    static loadSubcategoriesForCategory(categoryId, selectedSubcategoryId = null) {
        if (!categoryId) {
            $("#recordSubcategory").html('<option value="">Выберите подкатегорию</option>');
            return;
        }

        return $.ajax({
            url: `/api/subcategories/?category=${categoryId}&is_active=true`,
            type: "GET",
            dataType: "json",
            success: function (data) {
                let options = '<option value="">Выберите подкатегорию</option>';
                if (data.results && data.results.length > 0) {
                    options += data.results.map(
                        subcategory => `<option value="${subcategory.id}">${subcategory.name}</option>`
                    ).join("");
                }
                $("#recordSubcategory").html(options);

                if (selectedSubcategoryId) {
                    $("#recordSubcategory").val(selectedSubcategoryId);
                }
            },
            error: function (xhr, status, error) {
                console.log("Error loading subcategories:", error);
            },
        });
    }

    static async performDelete(url, successMessage, errorMessage) {
        try {
            await this.makeRequest(url, 'DELETE');
            this.showToast(successMessage, 'success');
            return true;
        } catch (xhr) {
            console.log("Error deleting:", errorMessage);
            this.showToast(errorMessage, 'error');
            return false;
        }
    }

    static async performEnable(url, successMessage, errorMessage) {
        try {
            await this.makeRequest(url, 'POST');
            this.showToast(successMessage, 'success');
            return true;
        } catch (xhr) {
            console.log("Error enabling:", errorMessage);
            this.showToast(errorMessage, 'error');
            return false;
        }
    }

    static async saveReferenceData(url, formData, formId, modalId, successMessage, errorMessage, reloadCallback) {
        try {
            this.clearFormErrors(formId);

            // Basic validation
            if (!formData.name || formData.name.trim() === '') {
                this.showFieldError(`${formId.replace('Form', 'NameError')}`, 'Название обязательно для заполнения');
                return false;
            }

            const method = this.currentEditingId ? 'PUT' : 'POST';
            const requestUrl = this.currentEditingId ? `${url}${this.currentEditingId}/` : url;

            await this.makeRequest(requestUrl, method, formData);
            this.showToast(successMessage, 'success');
            this.hideModal(modalId);
            if (reloadCallback) reloadCallback();
            return true;
        } catch (xhr) {
            this.handleFormErrors(xhr, formId);
            this.showToast(errorMessage, 'error');
            return false;
        }
    }

    static async saveSubcategoryData(url, formData, formId, modalId, successMessage, errorMessage, reloadCallback) {
        try {
            this.clearFormErrors(formId);

            // Basic validation
            if (!formData.category_id) {
                this.showFieldError('subcategoryCategoryError', 'Категория обязательна для заполнения');
                return false;
            }
            if (!formData.name || formData.name.trim() === '') {
                this.showFieldError('subcategoryNameError', 'Название обязательно для заполнения');
                return false;
            }

            const method = this.currentEditingId ? 'PUT' : 'POST';
            const requestUrl = this.currentEditingId ? `${url}${this.currentEditingId}/` : url;

            await this.makeRequest(requestUrl, method, formData);
            this.showToast(successMessage, 'success');
            this.hideModal(modalId);
            if (reloadCallback) reloadCallback();
            return true;
        } catch (xhr) {
            this.handleFormErrors(xhr, formId);
            this.showToast(errorMessage, 'error');
            return false;
        }
    }

    // Generic edit function
    static async editReferenceData(url, id, modalId, titleField, nameField, modalTitle, additionalCallback = null) {
        this.currentEditingId = id;
        try {
            const data = await this.makeRequest(`${url}${id}/`);
            $(titleField).text(modalTitle);
            $(nameField).val(data.name);

            if (additionalCallback) {
                additionalCallback(data);
            }
        } catch (xhr) {
            console.log("Error loading data:", error);
            this.showToast('Ошибка при загрузке данных', 'error');
        }
    }

    // Generic load function for reference tables
    static loadReferenceTable(url, tableBodyId, renderFunction, errorMessage) {
        return $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            success: function (data) {
                $(`#${tableBodyId}`).html(renderFunction(data.results));
            },
            error: function (xhr, status, error) {
                console.log("Error loading data:", error);
                CommonUtils.showToast(errorMessage, 'error');
            },
        });
    }

    static deleteRecord(id) {
        // Store the record ID in the confirm button
        $("#confirmDelete").data('record-id', id);
        // Show the confirmation modal
        $('#deleteConfirmModal').modal('show');
    }
}

// Make CommonUtils available globally
window.CommonUtils = CommonUtils;
