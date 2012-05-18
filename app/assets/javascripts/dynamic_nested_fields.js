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

var restore_dynamicsm = function(anchor, association) {
  if (association == "childs_teachers") {
    anchor.find("select:not(:disabled):not(.very-small)").combobox({
      association_class: association,
      selected: get_subject_collection
    });
  } else {
    anchor.find("select:not(:disabled):not(.very-small)").combobox({ association_class: association });
  }
  anchor.find("input.datepicker").datepicker({ dateFormat: cur_locale_date_format });
  anchor.find("input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy });
  
}
