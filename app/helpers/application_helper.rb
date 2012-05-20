module ApplicationHelper
  
  def get_authorized objects
    objects.keep_if do |obj|
      next unless obj
      can?(:show, obj)
    end
  end
  
end
