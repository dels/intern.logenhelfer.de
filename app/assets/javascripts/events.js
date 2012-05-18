clear_event_fields = function() {
  return $('.ajax_event_bookable_id').hide().empty();
}

flash_message = function(msg) {
  $("section nav#top-menu").after("<header class='ajax-generated' id='flash-warning'><span>" + msg + "</span></header>");
}

get_event_collection = function(event, ui) {
  $('body').addClass('reloading');
  $('section header.ajax-generated').remove();
  var jqxhr = $.ajax({
    url: "/calendar/events/autocomplete.json?type=" + $(this).val(),
    success: got_event_collection,
    error: got_failure
  })
}

got_event_collection = function(data) {
  var collection, optgroup, items, i, j;
  var select = $('<select id="event_bookable_id" name="event[bookable_id]" />')
  var has_data = false;

  clear_event_fields();


  if (data.collection && data.collection.length > 0) {
    collection = data.collection;
    for (i = 0; i < collection.length; ++i) {
      optgroup = $('<optgroup label="' + collection[i].group + '" />');
      if (collection[i].items.length > 0) {
        items = collection[i].items;
        for (j = 0; j < items.length; ++j) {
          optgroup.append('<option value="' + items[j].id + '">' + items[j].value + '</option>');
        }
        select.append(optgroup);
        has_data = true;
      }
    }
    if (has_data) {
      $('dt.ajax_event_bookable_id').text(data.name);
      $('dd.ajax_event_bookable_id').append(select);
      select.combobox();
      $('.ajax_event_bookable_id').show();
    }
  } else if (data.misc) {
    clear_event_fields();
    has_data = true;
  }

  if (!has_data) {
    var msg = $("#ajax-no-data").text();
    flash_message(msg);
    clear_event_fields();
  }
  $('body').removeClass('reloading');
}

got_failure = function() {
  var msg = $("#ajax-failure").text();
  flash_message(msg);
  clear_event_fields();
  $('body').removeClass('reloading');
}

get_subject_collection = function(event, ui) {
  $('body').addClass('reloading');
    $('section header.ajax-generated').remove();
    var new_id = $(event.target).attr('name').split('[')[2].replace("]", "");
    $.getJSON("/administration/schools/" + $(event.target).parent().parent().parent().children().find(".teachers_subjects").attr('school') + "/teachers/" + $(this).val() + "/subjects.json", function(data) {
      var items = [];
      
      $.each(data, function(key, val) {
        items.push('<input type="checkbox" name="child[childs_teachers_attributes][' + new_id + '][subjects][]" value="' + val.id + '">' + val.name + '<br />');
      });

      $(event.target).parent().parent().find(".teachers_subjects").html(items.join(''));
    });
    $('body').removeClass('reloading');
}

get_current_subject_collection = function() {
  if ($(".current_subjects").length > 0) {
    $('body').addClass('reloading');
    $(".current_subjects").each(function(index) {
      var teachers_subjects = $(this).parent().children("div.teachers_subjects");
      var childs_teacher_id = $(this).attr("value");
      var new_id = $(this).attr('name').split('[')[2].replace("]", "");
      //var teachers_subjects = $(this).parent().parent().children().find(".teachers_subjects");

      $.getJSON("/administration/childs_teachers/" + childs_teacher_id + "/taught.json", function(data) {
        var items = [];
        $.each(data, function(key, val) {
          items.push('<input type="checkbox" name="child[childs_teachers_attributes][' + new_id + '][subjects][]" value="' + val.id + '" checked="checked">' + val.name + '<br />');
        }); 
        $.getJSON("/administration/childs_teachers/" + childs_teacher_id + "/untaught.json", function(data) {
          $.each(data, function(key, val) {
            items.push('<input type="checkbox" name="child[childs_teachers_attributes][' + new_id + '][subjects][]" value="' + val.id + '">' + val.name + '<br />');
          });
          teachers_subjects.html(items.join(""));
          $('body').removeClass('reloading');
        });
      });
    });
  }
}

$(function() {
  $('#event_event_type').combobox({
    selected: get_event_collection
  });
  get_current_subject_collection();
});
