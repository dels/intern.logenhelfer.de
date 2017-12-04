class Officer < ActiveRecord::Base
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  belongs_to :role
  belongs_to :lodge

  validates_presence_of :firstname, :lastname, :role_id, :role_email, :lodge_id

  default_scope { where(:deleted => false) }

  def fullname
    "#{firstname} #{lastname}"
  end
  
end
