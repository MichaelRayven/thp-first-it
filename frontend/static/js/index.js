$(document).ready(function() {
  // Load initial data
  loadRecords();
  loadReferenceData();

  $("#recordCategory").change(function() {
    const selectedCategoryId = $(this).val();
    CommonUtils.loadSubcategoriesForCategory(selectedCategoryId);
  });

  // Filter change handlers
  $("#categoryFilter").change(function() {
    const selectedCategoryId = $(this).val();
    loadSubcategoriesForFilter(selectedCategoryId);
  });

  // Clear filters button
  $("#clearFilters").click(function() {
    clearFilters();
  });

  // Apply filters button
  $("#applyFilters").click(function() {
    applyFilters();
  });

  // Delete confirmation modal handler
  $("#confirmDelete").click(function() {
    const recordId = $(this).data('record-id');
    if (recordId) {
      performDelete(recordId);
    }
  });

  $("#saveCashFlowRecord").click(function() {
    // Get form data
    const formData = {
      status: parseInt($("#recordStatus").val()),
      transaction_type: parseInt($("#recordTransactionType").val()),
      category: parseInt($("#recordCategory").val()),
      subcategory: parseInt($("#recordSubcategory").val()),
      amount: parseFloat($("#recordAmount").val()),
      comment: $("#recordComment").val().trim()
    };

    // Basic validation
    if (!formData.status || !formData.transaction_type || !formData.category ||
        !formData.subcategory || !formData.amount || formData.amount <= 0) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const url = $("#cashFlowRecordForm").attr("action");
    const method = $("#cashFlowRecordForm").attr("method");

    $.ajax({
      url: url,
      type: method,
      data: JSON.stringify(formData),
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      success: function (data) {
        console.log('Success:', data);
        // Close modal
        $('#cashFlowRecordModal').modal('hide');
        // Reload the records table
        loadRecords();
        // Show success message
        CommonUtils.showToast('Запись успешно сохранена', 'success');
      },
      error: function (xhr, status, error) {
        console.log("Error:", xhr.responseText);
        try {
          const errorData = JSON.parse(xhr.responseText);
          CommonUtils.showToast('Ошибка при сохранении: ' + JSON.stringify(errorData), 'error');
        } catch (e) {
          CommonUtils.showToast('Ошибка при сохранении записи', 'error');
        }
      },
    });
  });
});

function createRecord() {
  $("#cashFlowRecordModalTitle").text("Создание записи ДДС");
  $("#cashFlowRecordForm").attr("action", `/api/cash-flow-records/`);
  $("#cashFlowRecordForm").attr("method", "POST");
  $("#recordAmount").val("");
  $("#recordComment").val("");
  $("#recordStatus").val("");
  $("#recordTransactionType").val("");
  $("#recordCategory").val("");
  $("#recordSubcategory").val("");
}

function loadRecords(filters = {}) {
  // Build query string from filters
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
  if (filters.category) params.append('category', filters.category);
  if (filters.subcategory) params.append('subcategory', filters.subcategory);
  if (filters.date_from) params.append('created_at_after', filters.date_from);
  if (filters.date_to) params.append('created_at_before', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/api/cash-flow-records/?${queryString}` : '/api/cash-flow-records/';

  $.ajax({
    url: url,
    type: "GET",
    dataType: "json",
    success: function (data) {
      $("#recordsTableBody").html(
        data.results.map(record => `
          <tr>
            <td>${new Date(record.created_at).toLocaleString("ru-RU")}</td>
            <td>${record.status.name}</td>
            <td>${record.transaction_type.name}</td>
            <td>${record.category.name}</td>
            <td>${record.subcategory.name}</td>
            <td>${record.amount}</td>
            <td>${record.comment || ''}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="editRecord(${record.id})" data-bs-toggle="modal" data-bs-target="#cashFlowRecordModal">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm" onclick="CommonUtils.deleteRecord(${record.id})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join("")
      );
    },
    error: function (xhr, status, error) {
      console.log("Error loading records:", error);
      CommonUtils.showToast('Ошибка при загрузке записей', 'error');
    },
  });
}

function loadReferenceData() {
  // Load statuses for both form and filter
  $.ajax({
    url: "/api/statuses/?is_active=true",
    type: "GET",
    dataType: "json",
    success: function (data) {
      const statusOptions = '<option value="">Выберите статус</option>' +
        data.results.map(status => `<option value="${status.id}">${status.name}</option>`).join("");
      $("#recordStatus").html(statusOptions);

      const filterStatusOptions = '<option value="">Все статусы</option>' +
        data.results.map(status => `<option value="${status.id}">${status.name}</option>`).join("");
      $("#statusFilter").html(filterStatusOptions);
    },
    error: function (xhr, status, error) {
      console.log("Error loading statuses:", error);
    },
  });

  // Load transaction types for both form and filter
  $.ajax({
    url: "/api/transaction-types/?is_active=true",
    type: "GET",
    dataType: "json",
    success: function (data) {
      const typeOptions = '<option value="">Выберите тип операции</option>' +
        data.results.map(type => `<option value="${type.id}">${type.name}</option>`).join("");
      $("#recordTransactionType").html(typeOptions);

      const filterTypeOptions = '<option value="">Все типы</option>' +
        data.results.map(type => `<option value="${type.id}">${type.name}</option>`).join("");
      $("#transactionTypeFilter").html(filterTypeOptions);
    },
    error: function (xhr, status, error) {
      console.log("Error loading transaction types:", error);
    },
  });

  // Load categories for both form and filter
  $.ajax({
    url: "/api/categories/?is_active=true",
    type: "GET",
    dataType: "json",
    success: function (data) {
      const categoryOptions = '<option value="">Выберите категорию</option>' +
        data.results.map(category => `<option value="${category.id}">${category.name}</option>`).join("");
      $("#recordCategory").html(categoryOptions);

      const filterCategoryOptions = '<option value="">Все категории</option>' +
        data.results.map(category => `<option value="${category.id}">${category.name}</option>`).join("");
      $("#categoryFilter").html(filterCategoryOptions);
    },
    error: function (xhr, status, error) {
      console.log("Error loading categories:", error);
    },
  });
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

  const toast = new bootstrap.Toast(document.getElementById('toast'));
  toast.show();
}

function editRecord(id) {
  $.ajax({
    url: `/api/cash-flow-records/${id}/`,
    type: "GET",
    dataType: "json",
    success: function (data) {
      $("#cashFlowRecordModalTitle").text("Редактирование записи ДДС");
      $("#cashFlowRecordForm").attr("action", `/api/cash-flow-records/${id}/`);
      $("#cashFlowRecordForm").attr("method", "PUT");

      // Load reference data for editing
      loadReferenceData();

      // Set form values
      $("#recordAmount").val(data.amount);
      $("#recordComment").val(data.comment || '');

      // Set dropdown values after a short delay to ensure options are loaded
      setTimeout(() => {
        $("#recordStatus").val(data.status.id);
        $("#recordTransactionType").val(data.transaction_type.id);
        $("#recordCategory").val(data.category.id);

        // Load subcategories for the selected category
        loadSubcategoriesForCategory(data.category.id, data.subcategory.id);
      }, 100);
    },
    error: function (xhr, status, error) {
      console.log("Error loading record:", error);
      CommonUtils.showToast('Ошибка при загрузке записи', 'error');
    },
  });
}

function loadSubcategoriesForCategory(categoryId, selectedSubcategoryId = null) {
  if (!categoryId) {
    $("#recordSubcategory").html('<option value="">Выберите подкатегорию</option>');
    return;
  }

  $.ajax({
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


function performDelete(id) {
  $.ajax({
    url: `/api/cash-flow-records/${id}/`,
    type: "DELETE",
    success: function () {
        CommonUtils.showToast('Запись успешно удалена', 'success');
      loadRecords();
      // Close the modal
      $('#deleteConfirmModal').modal('hide');
    },
    error: function (xhr, status, error) {
      console.log("Error deleting record:", error);
        CommonUtils.showToast('Ошибка при удалении записи', 'error');
      // Close the modal even on error
      $('#deleteConfirmModal').modal('hide');
    },
  });
}

function applyFilters() {
  const filters = {
    status: $("#statusFilter").val() || null,
    transaction_type: $("#transactionTypeFilter").val() || null,
    category: $("#categoryFilter").val() || null,
    subcategory: $("#subcategoryFilter").val() || null,
    date_from: $("#dateFromFilter").val() || null,
    date_to: $("#dateToFilter").val() || null
  };

  // Remove null values
  Object.keys(filters).forEach(key => {
    if (filters[key] === null) {
      delete filters[key];
    }
  });

  loadRecords(filters);
}

function clearFilters() {
  $("#statusFilter").val("");
  $("#transactionTypeFilter").val("");
  $("#categoryFilter").val("");
  $("#subcategoryFilter").val("");
  $("#dateFromFilter").val("");
  $("#dateToFilter").val("");

  // Clear subcategory filter options
  $("#subcategoryFilter").html('<option value="">Все подкатегории</option>');

  // Load all records without filters
  loadRecords();
}

function loadSubcategoriesForFilter(categoryId) {
  if (!categoryId) {
    $("#subcategoryFilter").html('<option value="">Все подкатегории</option>');
    return;
  }

  $.ajax({
    url: `/api/subcategories/?category=${categoryId}&is_active=true`,
    type: "GET",
    dataType: "json",
    success: function (data) {
      let options = '<option value="">Все подкатегории</option>';
      if (data.results && data.results.length > 0) {
        options += data.results.map(
          subcategory => `<option value="${subcategory.id}">${subcategory.name}</option>`
        ).join("");
      }
      $("#subcategoryFilter").html(options);
    },
    error: function (xhr, status, error) {
      console.log("Error loading subcategories for filter:", error);
    },
  });
}
