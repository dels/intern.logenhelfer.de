/*
window.remove_fields = (link)->
  $link = $ link
  $link.prev('input[type=hidden]').val('1')
  $link.closest(".fields").hide()

window.remove_address_fields = (link)->
  $link = $ link
  $link.prev('input[type=hidden]').val('1')
  container = $link.closest(".fields")
  container.hide()
  purpose = container.find('.fields_for_type_of_address select')
  text = purpose.find("option[value="+purpose.val()+"]").text()
  purpose.val('2')
  $link.find('.fields_for_address_purpose input').val(text)

window.add_fields = (link, association, content)->
  new_id = new Date().getTime()
  regexp = new RegExp("new_#{association}", "g")
  $(link).parent().after(content.replace(regexp, new_id))
  restore_dynamicsm($(link).parent().parent(), association)

window.add_fields_bottom = (link, association, content)->
  new_id = new Date().getTime()
  regexp = new RegExp("new_#{association}", "g")
  $(link).parent().siblings().last().after(content.replace(regexp, new_id))
  restore_dynamicsm($(link).parent().parent(), association)

window.set_purpose = ()->
  anchor = $(this).parent().parent().find('.fields_for_address_purpose')
  switch $(this).val()
    when '0'
      anchor.find('input').val('Privat')
      anchor.hide()
    when '1'
      anchor.find('input').val('Geschäftlich')
      anchor.hide()
    when '2'
      anchor.find('input').val('')
      anchor.show()

window.restore_dynamicsm = (anchor, association)->
  anchor.find("select:not(:disabled):not(.very-small):not(.type_of_address)").css({ width:'20em'}).select2()
  anchor.find("select.type_of_address").css({ width:'20em'}).select2().bind('change', set_purpose)

  anchor.find("input.datepicker").datepicker({ dateFormat: cur_locale_date_format })
  anchor.find("input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy })

jQuery ->
  $("select.type_of_address").css({ width:'20em'}).select2().bind('change', set_purpose)
*/
