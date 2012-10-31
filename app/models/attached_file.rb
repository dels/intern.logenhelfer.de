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
    if 0 > self.content_length
      reload
      self.content_length = self.content.length 
      self.save
    end
    content_length
  end
  
  def path_array
    [directory.category, directory, self]
  end
  
    
  def delete
    if APP_CONFIG[:archive]
      self.deleted = false
      self.directory.delete
    else
      self.deleted = true
    end
    self.save
  end
end
