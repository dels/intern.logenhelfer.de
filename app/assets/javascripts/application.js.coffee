//= require jquery
//= require jquery_ujs
//= require jquery-ui
//= require dynamic_nested_fields
//= require jquery.contextMenu
//= require autolink_table_rows
//= require calendar
//= require select2
//= require html54ie
//= require jquery.mailto
//= require best_in_place
//= require_self

jQuery ->
  # dropdown lists
  $("section select:not(:disabled):not(.very-small)").css(width: '20em').select2()

  # date picker
  $("section input.datepicker").datepicker(dateFormat: cur_locale_date_format)
  $("section input.datepicker-mmyy").datepicker(dateFormat: cur_locale_date_format_mmyy)

  $("#tabs").tabs()
  $('[data-behaviour="mailto"]').mailTo()

  # in-place editing
  $('.best_in_place').best_in_place()
  $('.best_in_place').bind "ajax:success", ->
    $(@).closest('tr').effect('highlight')

window.s4 = ->
  (((1+Math.random())*0x10000)|0).toString(16).substring(1)

window.random_password = ->
  s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()

window.random_email = ->
  "invalid-mail-#{s4()}-#{s4()}#{s4()}#{s4()}@fwze.de"

window.random_credentials = ->
  $('.random-email-input').val random_email()
  $('.random-password-input').val random_password()
