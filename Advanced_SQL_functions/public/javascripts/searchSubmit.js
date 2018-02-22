$(document).ready(function() {
    
        $('#searchForm').submit(function(event) {

            $('input#search-text').removeClass('is-invalid');
            $('.invalid-feedback').remove();
            $('div#query-container').empty();
            $('div#docnum-container').empty();
            $('div#card-container').empty();

            event.preventDefault();
            const formData = {
                'text': $('input[name="searchText"]').val(),
                'type': $('input:radio[name="searchType"]:checked').val(),
            };
      
            $.post('/search', formData, function(data) {
                
                if(!data.success) {
                    if(data.text) {
                        $('input#search-text').addClass('is-invalid');
                        $('div#text-group').append('<div class="invalid-feedback">' + data.text + '</div>');
                    }
                }
                else {
                    $('div#query-container').append('<p class="lead">SQL query string:</p><textarea id="sql-area" rows="10"></textarea>');
                    $('textarea#sql-area').val(data.query);
                    $('div#docnum-container').append('<p class="lead">Search found <b>' + data.result.length + '</b> documents:</p>');
                    data.result.forEach(function(row) {
                        $('div#card-container').append(`<div class="card"><div class="card-body">
                        <p class="lead float-right">Rank: ` + row.rank + `</p><h5 class="card-title">` + row.title + `</h5>
                        <h6 class="card-subtitle mb-2 text-muted">` + row.categories + `</h6>
                        <p class="card-text">` + row.summary + `</p></div></div>`);
                    });

                }
            });
    
        });
    });