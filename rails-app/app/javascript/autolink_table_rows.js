import 'jquery-contextmenu';

// Wait for document ready
$(function () {
  // Context menu for table rows
  $.contextMenu({
    selector: 'table.autolink tr',
    build: function (trigger, e) {
      // Get entries from data-context-menu attribute (should be an array)
      // If using JSON, you might need: JSON.parse($(trigger).attr('data-context-menu'))
      let entries = $(e.target).closest('tr').data('context-menu');
      if (entries === undefined) {
        return false;
      }
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

  // Initialize data-context-menu and row click behavior
  $('table.autolink tr').each(function (i, elem) {
    const tr = $(elem);
    const showLink = $('a.show', elem);
    const editLink = $('a.edit', elem);
    if (showLink.length === 0) return;
    // The context menu expects data in array form; encode as array/object
    tr.data('context-menu', [
      {
        name: 'Details...',
        icon: 'show',
        path: showLink.attr('href'),
      },
    ]);
    $(elem)
      .on('click', function () {
        window.location.href = showLink.attr('href');
      })
      .addClass('link');
  });
});
