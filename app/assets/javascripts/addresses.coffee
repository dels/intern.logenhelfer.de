jQuery ->
  $(document).on 'click', '.remove_fields', (event) ->
        $(this).closest('.fields').find('dl').remove()
        $(this).closest('.fields').find('input[type=hidden]').val('1')
        $(this).closest('.fields').hide()
        event.preventDefault()

  $(document).on 'click', '.add_fields', (event) ->
        time = new Date().getTime()
        regexp = new RegExp($(this).data('id'), 'g')
        $(this).before($(this).data('fields').replace(regexp, time))
        event.preventDefault()
        
#  $(document).on 'click', (event) ->
#    console.log("click: ")
#    console.log($(event.target))

  $(document).on 'change', (event) ->
    console.log("change: ")
    console.log($(event))


  $('select#user_addresses_attributes_1512610198516_type_of_address').on 'change', (event) ->
    console.log("changed user_addresses_attributes_1512610198516_type_of_address")

  $('select.type_of_address').on 'change', (event) ->
    console.log("changed type of address")
    
  $('select.type_of_address').on 'click', (event) ->
    console.log("clicked type of address")

  $("dd").click ->
    console.log("JUHU!!!")

  $('.fields_for_address_type_of_address').find('select').click ->
    console.log("click select in type of address")
  
  $("select").change ->
    console.log("any select changed")

  $(document).on 'change', '.fields_for_address_purpose', (event) ->
    alert("select")


    
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

