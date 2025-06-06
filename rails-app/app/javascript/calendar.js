import 'jquery-contextmenu';

$(function () {
  // Context menu for calendar cells
  $.contextMenu({
    selector: 'table.calendar',
    build: function (trigger, e) {
      // Try to find entries from the data attribute of the clicked cell
      const entries = $(e.target).closest('td').data('context-menu');
      if (!entries) return false;

      let items = {
        callback: function () {},
        items: {},
      };

      entries.forEach((elem, i) => {
        if (elem.path) {
          items.items['item' + i] = {
            ...elem,
            callback: () => {
              window.location.href = elem.path;
            },
          };
        } else {
          items.items['item' + i] = elem;
        }
      });

      return items;
    },
  });

  // Click on table.calendar td (not .time): go to path in context menu
  $('table.calendar td:not(.time)').on('click', function () {
    const entries = $(this).data('context-menu');
    if (entries && entries[1] && entries[1].path) {
      window.location.href = entries[1].path;
    }
  });

  // Click on calendar cell divs: go to path in data-path
  $('table.calendar.month tbody td div').on('click', function () {
    const path = $(this).data('path');
    if (path) {
      window.location.href = path;
    }
  });
});
