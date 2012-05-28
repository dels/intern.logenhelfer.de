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

var set_purpose = function(event, ui){
  if('0' == $(this).val()){
    $(this).parent().parent().find("dd.fields_for_address_purpose input")[0].value = "Privat";
    $(this).parent().parent().find("dd.fields_for_address_purpose input")[0].disabled = "true";
    return;
  }
  if('1' == $(this).val()){
    $(this).parent().parent().find("dd.fields_for_address_purpose input")[0].value = "Geschäftlich";
    $(this).parent().parent().find("dd.fields_for_address_purpose input")[0].disabled = "true";
    return;
  }
  if('2' == $(this).val()){
    $(this).parent().parent().find("dd.fields_for_address_purpose input")[0].value = "";
    $(this).parent().parent().find("dd.fields_for_address_purpose input").removeAttr("disabled");
    return;
  }
}

var restore_dynamicsm = function(anchor, association) {
  anchor.find("select:not(:disabled):not(.very-small):not(.type_of_address)").combobox({ association_class: association });
  anchor.find("select.type_of_address").combobox({
    association_class: association,
    selected: set_purpose
  });
  anchor.find("input.datepicker").datepicker({ dateFormat: cur_locale_date_format });
  anchor.find("input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy });
  anchor.find("select:not(:disabled):not(.very-small)").combobox({ association_class: association });
}
