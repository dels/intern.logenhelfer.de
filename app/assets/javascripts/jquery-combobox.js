(function( $ ) {
  $.widget( "ui.combobox", {
    options: {
      association_class: ""
    },
    _setOption: function( key, value ) {
      switch( key ) {
        case "association_class":
          this.options[key] = value;
          break;
      }
    },
    _create: function() {
      var self = this,
        select = this.element.hide(),
        selected = select.find( ":selected" ),
        value = selected.val() ? selected.text() : "",
        options = self.options;
      var input = this.input = $( "<input>" )
        .insertAfter( select )
        .val( value )
        .autocomplete({
          bullet: (this.options.bullet) ? this.options.bullet : null,
          delay: 0,
          minLength: 0,
          source: function( request, response ) {
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
            response( select.find( "option" ).map(function() {
                optgroup = $(select).find('option[value="'+this.value+'"]').parent('optgroup');
                if (optgroup.length == 0) {
                  var item_category = 0;
                } else {
                  var item_category = optgroup.attr('label');
                }
                var text = $( this ).text();
                if ( this.value && ( !request.term || matcher.test(text) ) ) {
                  return {
                    label: text.replace(
                      new RegExp(
                        "(?![^&;]+;)(?!<[^<>]*)(" +
                        $.ui.autocomplete.escapeRegex(request.term) +
                        ")(?![^<>]*>)(?![^&;]+;)", "gi"
                      ), "<strong>$1</strong>" ),
                    value: text,
                    category: item_category,
                    option: this
                  };
                } else {
                  return null;
                }
            }) );
          },
          select: function( event, ui ) {
            ui.item.option.selected = true;
            self._trigger( "selected", event, {
              item: ui.item.option
            });
          },
          change: function( event, ui ) {
            if ( !ui.item ) {
              var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
                valid = false;
              select.children( "option" ).each(function() {
                if ( $( this ).text().match( matcher ) ) {
                  this.selected = valid = true;
                  return false;
                }
              });
              if ( !valid ) {
                // remove invalid value, as it didn't match anything
                $( this ).val( "" );
                select.val( "" );
                input.data( "autocomplete" ).term = "";
                return false;
              }
            }
          }
        })
        .addClass( "ui-widget ui-widget-content ui-corner-left" );
      input.addClass(options.association_class);

      input.data( "autocomplete" )._renderItem = function( ul, item ) {
        if (this.options.bullet) {
          bullet = '&#8227;';
        } else {
          bullet = '';
        }
        return $( "<li></li>" )
          .data( "item.autocomplete", item )
          .append( "<a>" + bullet + item.label + "</a>" )
          .appendTo( ul );
      };

      input.data( "autocomplete" )._renderMenu = function( ul, items ) {
        var self = this,
          currentCategory = "";
        $.each( items, function( index, item ) {
          if (item.category != 0) {
            if ( item.category != currentCategory ) {
              ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
              currentCategory = item.category;
            }
          }
          self._renderItem( ul, item );
        });
        ul.removeClass('ui-corner-all').addClass('ui-corner-bottom');
      };

      this.button = $( "<button type=\"button\">�</button>" )
        .attr( "tabIndex", -1 )
        .attr( "title", "Show All Items" )
        .insertAfter( input )
        .button({
          icons: {
            primary: "ui-icon-triangle-1-s"
          },
          text: false
        })
        .removeClass( "ui-corner-all" )
        .addClass( "ui-corner-right ui-button-icon" )
        .click(function() {
          // close if already visible
          if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
            input.autocomplete( "close" );
            return;
          }

          // pass empty string as value to search for, displaying all results
          input.autocomplete( "search", "" );
          input.focus();
        });
    },

    destroy: function() {
      this.input.remove();
      this.button.remove();
      this.element.show();
      $.Widget.prototype.destroy.call( this );
    }
  });
})( jQuery );
