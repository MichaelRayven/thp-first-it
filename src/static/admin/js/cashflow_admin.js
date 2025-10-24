(function($) {
    'use strict';

    $(document).ready(function() {
        // Function to update subcategory options based on selected category
        function updateSubcategories() {
            var categoryId = $('#id_category').val();
            var subcategorySelect = $('#id_subcategory');

            // Clear existing options
            subcategorySelect.empty();
            subcategorySelect.append('<option value="">---------</option>');

            if (categoryId) {
                // Make AJAX request to get subcategories
                $.ajax({
                    url: '../ajax/get-subcategories/',
                    data: {
                        'category_id': categoryId
                    },
                    dataType: 'json',
                    success: function(data) {
                        $.each(data.subcategories, function(index, subcategory) {
                            subcategorySelect.append(
                                '<option value="' + subcategory.id + '">' +
                                subcategory.name + '</option>'
                            );
                        });
                    },
                    error: function() {
                        console.log('Error loading subcategories');
                    }
                });
            }
        }

        // Bind change event to category select
        $('#id_category').on('change', updateSubcategories);

        // Initialize subcategories on page load if category is already selected
        updateSubcategories();
    });
})(django.jQuery);
