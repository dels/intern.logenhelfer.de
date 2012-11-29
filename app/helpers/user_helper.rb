module UserHelper

  def limited_editing?
    @le ||= current_user.role_ids & Role.where(name: ['Admin', 'Secretary']).pluck(:id)
    @le.blank?
  end

end