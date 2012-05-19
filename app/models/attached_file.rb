class AttachedFile < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  belongs_to :directory

  attr_accessible :filename, :content, :content_type, :directory_id

  default_scope where(:deleted => false)
end
