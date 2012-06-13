class AttachedFile < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  belongs_to :directory
  belongs_to :uploader, :class_name => "User"
  has_many :file_downloads
  has_many :attached_file_roles
  has_many :roles, :through => :attached_file_roles

  attr_accessible :filename, :content, :content_type, :directory_id, :role_ids

  default_scope where(:deleted => (Rails.env.archive? || Rails.env.archive_dev?))
  
  
  def size
    content.length
  end
  
  def path_array
    [directory.category, directory, self]
  end
  
    
  def delete
    if APP_CONFIG[:archive]
      deleted = false
      directory.delete
    else
      deleted = true
    end
    save
  end
end
