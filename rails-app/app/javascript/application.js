// Standard npm packages
import "./shim-jquery.js";
import $ from 'jquery';

if (typeof $.fn.select2 === 'undefined' && typeof window.$ !== 'undefined') {
  const select2Plugin = require('select2/dist/js/select2.full.js');
  window.$.fn.select2 = select2Plugin;
  window.jQuery.fn.select2 = select2Plugin;
}

import 'jquery-ui/dist/jquery-ui.js';
import 'bootstrap';
import 'jquery-contextmenu';
import 'jquery-ui/ui/widgets/datepicker';

// Local/legacy modules (adjust paths if needed)
import './dynamic_nested_fields';
import './autolink_table_rows';
import './calendar';
import './addresses';
import './jquery.mailto';


if (!$.fn.select2 && window.Select2) {
  $.fn.select2 = window.Select2;
  window.$.fn.select2 = window.Select2;
}

// Document ready function (modern jQuery)
$(function() {
  // dropdown lists
  $("section select:not(:disabled):not(.very-small)").css({ width: '20em' }).select2();

  // date picker
  $("section input.datepicker").datepicker({ dateFormat: window.cur_locale_date_format });
  $("section input.datepicker-mmyy").datepicker({ dateFormat: window.cur_locale_date_format_mmyy });

  $("#tabs").tabs();
  $('[data-behaviour="mailto"]').mailTo();

  // in-place editing (if you have best_in_place re-added)
  if ($('.best_in_place').length && $.fn.best_in_place) {
    $('.best_in_place').best_in_place();
    $('.best_in_place').on("ajax:success", function() {
      $(this).closest('tr').effect('highlight');
    });
  }
});

// Utility functions as globals
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

$(function () {
  $('[data-behaviour="mailto"]').mailTo();
});