$(function() {
  // currently broken
  // $.contextMenu({
  //   selector: 'table.autolink tr',
  //   build: function(trigger, e) {
  //     var entries = $(e.toElement).closest('tr').data('context-menu');
  //     if (entries == undefined) {
  //       return false;
  //     }
  //     var items = {
  //       callback: function() {},
  //       items: {}
  //     };
  //     var i = 0
  //     $.each(entries, function(i,elem) {
  //       if (elem.path) {
  //         items.items['item'+i] = elem;
  //         items.items['item'+i].callback = function() {
  //           window.location.href = elem.path
  //         }
  //       } else {
  //         items.items['item'+i] = elem;
  //       }
  //     });
  //     return items;
  //   }
  // })

  $('table.autolink tr').each(function(i,elem) {
    var tr = $(elem);
    var showLink = $('a.show', elem);
    var editLink = $('a.edit', elem);
    if (showLink.length == 0)
      return;
    tr.attr("data-context-menu", [
      {
        name: "Details...",
        icon: "show",
        path: showLink.attr('href')
      }
    ]);
    $(elem).click(function() {
      window.location.href = showLink.attr('href');
    }).addClass('link');
  })
})