//= require jquery
//= require jquery_ujs
//= require jquery.ui.all
//= require jquery-combobox
//= require dynamic_nested_fields
//= require jquery.flot
//= require jquery.contextMenu
//= require autolink_table_rows
//= require calendar
//= require events
//= require select2
//= require_self

jQuery(function() {
  // dropdown lists
  $("section select:not(:disabled):not(.very-small)").select2();

  // date picker
  $("section input.datepicker").datepicker({ dateFormat: cur_locale_date_format });
  $("section input.datepicker-mmyy").datepicker({ dateFormat: cur_locale_date_format_mmyy });

  $("#tabs").tabs();

  $('#state-changer select').change(function() {
    $('body').addClass('reloading');
    $(this).parent().get(0).submit();
  });
  $('#state-changer input:submit').remove();
  $('#former').hide();
  $('#hide_former_teachers').hide();
  $('#show_former_teachers').click(function() {
    $('#former').show();
    $('#show_former_teachers').hide();
    $('#hide_former_teachers').show();
  });
  $('#hide_former_teachers').click(function() {
    $('#former').hide();
    $('#hide_former_teachers').hide();
    $('#show_former_teachers').show();
  });
});

function hideDiv(element, hide){
  el = document.getElementById(element);
  if(!hide){
    el.style.display = 'block';
  }
  else{
    el.style.display = 'none';
  }
}

var s4 = function() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

var random_password = function() {
  return (s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4());
}

var random_email = function() {
  return ("invalid-mail-" + s4() + "-" + s4() + s4() + s4() +"@paedagogikum.de");
}

var random_credentials = function() {
  $('.random-email-input').val(random_email());
  $('.random-password-input').val(random_password());
}


jQuery.fn.maxLength = function(max, charsLeftId){
	this.each(function(){
		var type = this.tagName.toLowerCase();
		var inputType = this.type? this.type.toLowerCase() : null;
		if(type == "input" && inputType == "text" || inputType == "password"){
			//Apply the standard maxLength
			this.maxLength = max;
		}
		else if(type == "textarea"){
			if(charsLeftId){
				$(charsLeftId).text((max - this.value.length).toString());
			}
			this.onkeypress = function(e){
				var ob = e || event;
				var keyCode = ob.keyCode;
				var hasSelection = document.selection? document.selection.createRange().text.length > 0 : this.selectionStart != this.selectionEnd;
				return !(this.value.length >= max && (keyCode > 50 || keyCode == 32 || keyCode == 0 || keyCode == 13) && !ob.ctrlKey && !ob.altKey && !hasSelection);
			};
			this.onkeyup = function(){
				if(this.value.length > max){
					this.value = this.value.substring(0,max);
				}
				if(charsLeftId){
					$(charsLeftId).text((max - this.value.length).toString());
				}
			};
		}
	});
};
