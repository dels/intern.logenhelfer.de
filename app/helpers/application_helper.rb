module ApplicationHelper

  def sortable(column, title = nil)
    column = column.to_s
    title ||= column.titleize
    css_class = (column == sort_column) ? "current #{sort_direction}" : nil
    direction = (column == sort_column && sort_direction == "asc") ? "desc" : "asc"
    link_to title, {:sort_by => column, :direction => direction}, {:class => css_class}
  end

  def link_to_remove_fields(name, f, js_function=:remove_fields)
    f.hidden_field(:_destroy) + link_to_function(name, js_functions_collection(js_function))
  end

  def link_to_add_fields(name, f, association, js_function=:add_fields)
    new_object = f.object.class.reflect_on_association(association).klass.new
    fields = f.fields_for(association, new_object, :child_index => "new_#{association}") do |builder|
      render(association.to_s.pluralize + "/form_fields", :f => builder)
    end
    link_to_function(name, js_functions_collection(js_function)[association, fields])
  end

  def js_functions_collection which
    @signatures ||= {
      add_fields: ->(assoc, fields) {
        "add_fields(this, '#{assoc}', '#{escape_javascript(fields)}')"
      },
      add_fields_bottom: ->(assoc, fields) {
        "add_fields_bottom(this, '#{assoc}', '#{escape_javascript(fields)}')"
      },
      remove_fields: "remove_fields(this)",
      remove_address_fields: "remove_address_fields(this)"
    }
    @signatures[which]
  end

  def get_authorized_paginated objects
    Kaminari.paginate_array(get_authorized objects)
  end

  def get_authorized objects
    objects.delete_if do |obj|
      cannot?(:show, obj)
    end
  end

  def limited_editing
    [] == (current_user.roles & (Role.where(name: ['Admin', 'Secretary'])))
  end

end
