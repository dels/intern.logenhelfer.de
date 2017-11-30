module AddressHelper


  def link_to_add_fields(name, f, association)
    new_object = f.object.send(association).klass.new
    id = new_object.object_id
    fields = f.fields_for(association, new_object, child_index: id) do |address|
      render(association.to_s.pluralize + "/form_fields", f: address)
    end
    link_to(name, '', class: "add_fields", data: { id: id, fields: fields.gsub("\n", "")})
  end

  def link_to_remove_fields(name, f, association)
    f.hidden_field(:_destroy) + link_to_function(name, :remove_fields)
  end
  
=begin
  def link_to_add_fields(name, f, association, js_function=:add_fields)
    new_object = f.object.class.reflect_on_association(association).klass.new
    fields = f.fields_for(association, new_object, :child_index => "new_#{association}") do |builder|
      render(association.to_s.pluralize + "/form_fields", f: builder)
    end
    link_to(name, '', class: js_functions_collection(js_function)[association, fields])

    
#    link_to(name, '', class: "add_fields", data: { id: id, fields: fields.gsub("\n", "")})
  end

  def link_to_remove_fields(name, f, js_function=:remove_fields)
    f.hidden_field(:_destroy) + link_to_function(name, js_functions_collection(js_function))
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
=end
end
