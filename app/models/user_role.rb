class UserRole < ActiveRecord::Base

  belongs_to :user
  belongs_to :role

#  validates_uniqueness_of :role_id, :unless => :role_is_group
#  validates_presence_of :user_id
#  validates_uniqueness_of [:user_id, :role_id], :message => I18n.t("activerecord.errors.user_cant_have_one_role_two_times")

  after_save do |usr|
    UserRole.where("id <> ?", usr.id).where(role_id: usr.role_id).first.delete rescue nil unless  role.is_group?
  end
  
  def to_s
    return role unless role_added_at
    "#{role} (#{I18n.t('helpers.since')} #{I18n.l(role_added_at)})"
  end
  
  def role_is_group
    return role.is_group?
  end
end
