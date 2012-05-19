class AttachedFile < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  belongs_to :directory
  belongs_to :uploader, :class_name => "User"
  has_many :attached_file_roles
  has_many :roles, :through => :attached_file_roles


  attr_accessible :filename, :content, :content_type, :directory_id

  default_scope where(:deleted => false)
  
  def size
    content.length
  end
  
  def path_array
    [directory.category, directory, self]
  end
end
