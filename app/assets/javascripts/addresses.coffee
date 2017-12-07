
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

window.restore_dynamicsm = (anchor)->
    anchor.find("select.type_of_address").css({ width:'20em'}).select2().bind('change', set_purpose)

jQuery ->
  $(document).on 'click', '.remove_fields', (event) ->
        $(this).closest('.fields').find('dl').remove()
        $(this).closest('.fields').find('input[type=hidden]').val('1')
        $(this).closest('.fields').hide()
        event.preventDefault()

  $(document).on 'click', '.add_fields', (event) ->
        console.log("adding fields")
        time = new Date().getTime()
        regexp = new RegExp($(this).data('id'), 'g')
        $(this).before($(this).data('fields').replace(regexp, time))
        event.preventDefault()
        restore_dynamicsm($(event.target).parent().parent())


