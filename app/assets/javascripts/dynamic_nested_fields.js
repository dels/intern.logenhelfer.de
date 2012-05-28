var remove_fields = function(link) {
  $(link).prev("input[type=hidden]").val("1");
  $(link).closest(".fields").hide();
}

var add_fields = function(link, association, content) {
  var new_id = new Date().getTime();
  var regexp = new RegExp("new_" + association, "g")
  $(link).parent().after(content.replace(regexp, new_id));
  restore_dynamicsm($(link).parent().parent(), association);
}

var add_fields_bottom = function(link, association, content) {
  var new_id = new Date().getTime();
  var regexp = new RegExp("new_" + association, "g")
  $(link).parent().siblings().last().after(content.replace(regexp, new_id));
  restore_dynamicsm($(link).parent().parent(), association);
}

var set_purpose = function() {
  var anchor = $(this).parent().parent().find(".fields_for_address_purpose");
  switch ($(this).val()) {
    case '0':
      anchor.find('input').val("Privat");
      anchor.hide();
      break;
    case '1':
      anchor.find('input').val("Geschäftlich");
      anchor.hide();
      break;
    case '2':
      anchor.find('input').val("");
      anchor.show();
      break;
  }
}

var restore_dynamicsm = function(anchor, association) {
  anchor.find("select:not(:disabled):not(.very-small):not(.type_of_address)").css({ width:'20em'}).select2();
  anchor.find("select.type_of_address").css({ width:'20em'}).select2().bind('change', set_purpose);

  anchor.find("input.datepicker").datepicker({ dateFormat: cur_locale_date_format });
  anchor.find("input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy });
}

$(function() {
  $("select.type_of_address").css({ width:'20em'}).select2().bind('change', set_purpose);
})
