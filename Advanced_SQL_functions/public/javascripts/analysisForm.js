$(document).ready(function() {
    
        $('#analysisForm').submit(function(event) {

            $('#table-row').empty();


            event.preventDefault();
            const formData = {
                'from': $('input#from-date').val(),
                'to': $('input#to-date').val(),
                'type': $('input:radio[name="analysisType"]:checked').val(),
            };
      
            $.post('/analysis', formData, function(data) {
                
                console.log(data);
                if(!data.success) {
                    if(data.text) {
                        
                    }
                }
                else {
                    $('div#table-row').append(`<table id="analysis-table"
                     class="table table-responsive"><thead><tr id="head-row"></tr></thead><tbody id="table-body"></tbody></table>`);
                    data.result.fields.forEach(function(f){
                        $('#head-row').append('<th scope="col">' + f.name + '</th>');
                    });
                    data.result.rows.forEach(function(r) {
                        let string = "";
                        r.forEach(function(element) {
                            string = string + "<td>" + element + "</td>";
                        });

                        $('#table-body').append("<tr>"+ string +"</tr>");
                    });
                }
            });
    
        });
    });