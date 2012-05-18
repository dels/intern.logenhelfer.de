$(function() {
  $.contextMenu({
    selector: 'table.calendar',
    build: function(trigger, e) {
      var entries = $(e.toElement).closest('td').data('context-menu');
      if (entries == undefined) {
        return false;
      }
      var items = {
        callback: function() {},
        items: {}
      };
      var i = 0
      $.each(entries, function(i,elem) {
        if (elem.path) {
          items.items['item'+i] = elem;
          items.items['item'+i].callback = function() {
            window.location.href = elem.path
          }
        } else {
          items.items['item'+i] = elem;
        }
      });
      return items;
    }
  })

  $('table.calendar td:not(.time)').click(function() {
    window.location.href = $(this).data('context-menu')[1].path;
  })
})