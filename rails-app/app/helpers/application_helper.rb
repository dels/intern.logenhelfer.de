module ApplicationHelper

  def sortable(column, title = nil)
    column = column.to_s
    title ||= column.titleize
    css_class = (column == sort_column) ? "current #{sort_direction}" : nil
    direction = (column == sort_column && sort_direction == "asc") ? "desc" : "asc"
    link_to title, {:sort_by => column, :direction => direction}, {:class => css_class}
  end

  def get_authorized_paginated objects
    Kaminari.paginate_array(get_authorized objects)
  end

  def get_authorized objects
    objects.to_a.delete_if do |obj|
      cannot?(:show, obj)
    end
  end

  def limited_user_editing?
    roles = ['UserAdmin', 'Admin', 'Secretary']
    @le ||= current_user.role_ids & Role.where(name: roles).pluck(:id)
    @le.blank?
  end

end
