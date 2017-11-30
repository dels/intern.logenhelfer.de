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
