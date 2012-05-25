module ApplicationHelper
  
  def sortable(column, title = nil)
    column = column.to_s
    title ||= column.titleize
    css_class = (column == sort_column) ? "current #{sort_direction}" : nil
    direction = (column == sort_column && sort_direction == "asc") ? "desc" : "asc"
    link_to title, {:sort_by => column, :direction => direction}, {:class => css_class}
  end


  def link_to_remove_fields(name, f)
    f.hidden_field(:_destroy) + link_to_function(name, "remove_fields(this)")
  end

  def link_to_add_fields(name, f, association, js_function=:add_fields)
    new_object = f.object.class.reflect_on_association(association).klass.new
    fields = f.fields_for(association, new_object, :child_index => "new_#{association}") do |builder|
      render(association.to_s.pluralize + "/form_fields", :f => builder)
    end
    link_to_function(name, add_fields_js_functions(js_function)[association, fields])
  end

  def add_fields_js_functions which
    @signatures ||= {
      :add_fields => lambda {|assoc, fields|
        "add_fields(this, '#{assoc}', '#{escape_javascript(fields)}')"
      },
      :add_fields_bottom => lambda {|assoc, fields|
        "add_fields_bottom(this, '#{assoc}', '#{escape_javascript(fields)}')"
      }
    }
    @signatures[which]
  end

  def get_authorized objects
    objects.delete_if do |obj|
      cannot?(:show, obj)
    end
  end
  
end
