// Set the purpose of an address field based on select value
window.set_purpose = function() {
  const anchor = $(this).closest('.fields').find('.fields_for_address_purpose');
  switch ($(this).val()) {
    case '0':
      anchor.find('input').val('Privat');
      anchor.hide();
      break;
    case '1':
      anchor.find('input').val('Geschäftlich');
      anchor.hide();
      break;
    case '2':
      anchor.find('input').val('');
      anchor.show();
      break;
  }
};

// Re-initialize select2 for address type dropdowns
window.restore_dynamicsm = function(anchor) {
  anchor
    .find("select.type_of_address")
    .css({ width: '20em' })
    .select2()
    .on('change', window.set_purpose);
};

// Document ready: Attach events
$(document).on('click', '.remove_fields', function(event) {
  $(this).closest('.fields').find('dl').remove();
  $(this).closest('.fields').find('input[type=hidden]').val('1');
  $(this).closest('.fields').hide();
  event.preventDefault();
});

$(document).on('click', '.add_fields', function(event) {
  console.log("adding fields");
  const time = new Date().getTime();
  const regexp = new RegExp($(this).data('id'), 'g');
  $(this).before($(this).data('fields').replace(regexp, time));
  event.preventDefault();
  window.restore_dynamicsm($(event.target).closest('.fields'));
});
