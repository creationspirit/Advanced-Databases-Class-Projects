$(document).ready(function() {

    $('#createForm').submit(function(event) {
        
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').remove();

        event.preventDefault();
        const formData = {
            'title': $('textarea#title').val(),
            'categories': $('textarea#categories').val(),
            'summary': $('textarea#summary').val(),
            'description': $('textarea#description').val(),
        };
  
    $.post('movies', formData, function(data){

        if(!data.success) {
            if(data.errors.title) {
                $('textarea#title').addClass('is-invalid');
                $('#title-group').append('<div class="invalid-feedback">' + data.errors.title + '</div>');
            }
            if(data.errors.categories) {
                $('textarea#categories').addClass('is-invalid');
                $('#categories-group').append('<div class="invalid-feedback">' + data.errors.categories + '</div>');
            }
            if(data.errors.summary) {
                $('textarea#summary').addClass('is-invalid');
                $('#summary-group').append('<div class="invalid-feedback">' + data.errors.summary + '</div>');
            }
            if(data.errors.description) {
                $('textarea#description').addClass('is-invalid');
                $('#description-group').append('<div class="invalid-feedback">' + data.errors.description + '</div>');
            }
        }
        else {
            $('#createForm').append('<div class="alert alert-success">' + data.message + '</div>');
        }
    });

    });
});