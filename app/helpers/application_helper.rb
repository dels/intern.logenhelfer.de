module ApplicationHelper
  
  def get_authorized objects
    objects.keep_if do |obj|
      can?(:show, obj)
    end
  end
  
end
