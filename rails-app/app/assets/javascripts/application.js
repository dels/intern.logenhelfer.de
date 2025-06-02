// Importing necessary libraries
import $ from 'jquery';
import 'jquery-ui';
import 'select2';
import 'jquery.contextMenu';
import 'dynamic_nested_fields';
import 'autolink_table_rows';
import 'calendar';
import 'addresses';
import 'html54ie';
import 'jquery.mailto';
import 'best_in_place';
import 'bootstrap-sprockets';

// Document ready function
$(function() {
  // dropdown lists
  $("section select:not(:disabled):not(.very-small)").css({ width: '20em' }).select2();

  // date picker
  $("section input.datepicker").datepicker({ dateFormat: cur_locale_date_format });
  $("section input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy });

  $("#tabs").tabs();
  $('[data-behaviour="mailto"]').mailTo();

  // in-place editing
  $('.best_in_place').best_in_place();
  $('.best_in_place').on("ajax:success", function() {
    $(this).closest('tr').effect('highlight');
  });
});

window.s4 = function() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

window.random_password = function() {
  return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
};

window.random_email = function() {
  return "invalid-mail-" + s4() + "-" + s4() + s4() + s4() + "@fwze.de";
};

window.random_credentials = function() {
  $('.random-email-input').val(random_email());
  $('.random-password-input').val(random_password());
};

