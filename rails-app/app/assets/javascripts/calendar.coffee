jQuery ->
  $.contextMenu
    selector: 'table.calendar'
    build: (trigger, e)->
      entries = $(e.toElement).closest('td').data('context-menu')
      return false unless entries?

      items =
        callback: ->
        items: {}

      i = 0
      $.each entries, (i,elem)->
        if elem.path
          items.items["item#{i}"] = elem
          items.items["item#{i}"].callback = ->
            window.location.href = elem.path
        else
          items.items["item#{i}"] = elem
      items

  $('table.calendar td:not(.time)').click ->
    window.location.href = $(this).data('context-menu')[1].path

  $('table.calendar.month tbody td div').click ->
    window.location.href = $(this).data('path')