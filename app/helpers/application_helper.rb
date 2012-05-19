module ApplicationHelper
  
  def get_authorized objects
    return objects if current_user.role_ids.include?(Role.find_by_name("Admin").id)
    objects.delete_if do |obj|
      (obj.role_ids & current_user.role_ids) == []
    end
  end
  
end
