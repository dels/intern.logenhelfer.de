module ApplicationHelper
  
  def sortable(column, title = nil)
    column = column.to_s
    title ||= column.titleize
    css_class = (column == sort_column) ? "current #{sort_direction}" : nil
    direction = (column == sort_column && sort_direction == "asc") ? "desc" : "asc"
    link_to title, {:sort_by => column, :direction => direction}, {:class => css_class}
  end

  def get_authorized objects
    objects.delete_if do |obj|
      cannot?(:show, obj)
    end
  end
  
end
