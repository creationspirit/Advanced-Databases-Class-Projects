$(document).ready(() => {

    var options = {
        
          url: function(phrase) {
            return "/autocomplete";
          },

          categories: [{
            listLocation: "result",
            maxNumberOfElements: 5,
            }],
        
          getValue: function(element) {
            return element.summary;
          },

          template: {
            type: "description",
            fields: {
                description: "title"
            }
            },
        
          ajaxSettings: {
            dataType: "json",
            method: "POST",
            data: {
              dataType: "json"
            }
          },
        
          preparePostData: function(data) {
            data.phrase = $("input#search-text").val();
            return data;
          },
        
          requestDelay: 200
        };
        
        $("input#search-text").easyAutocomplete(options);

});