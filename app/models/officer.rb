class Officer < ActiveRecord::Base
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  belongs_to :role
  belongs_to :lodge

  attr_accessible :lodge_id, :firstname, :lastname, :role_id, :role_email

  validates_presence_of :firstname, :lastname, :role_id, :role_email, :lodge_id

  default_scope where(:deleted => false)
end
