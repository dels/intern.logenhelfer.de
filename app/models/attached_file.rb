class AttachedFile < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid
  before_create :slug_name

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
    if AppConfig[:archive]
      self.deleted = false
      self.directory.delete
    else
      self.deleted = true
    end
    self.save
  end

  def slug_name
    o_name = self.filename
    if AttachedFile.exists?(filename: o_name)
      i = 2
      begin
        self.filename = o_name.gsub(/^(.*?)\.(.*?)$/, "\\1 (#{i}).\\2")
        i += 1
      end while AttachedFile.exists?(filename: self.filename)
    end
  end

  def self.memory_used
    sum = 0
    AttachedFile.select('content_length').each {|file| sum += file.content_length }
    sum
  end

  def self.memory_used_incl_archived
    sum = 0
    AttachedFile.unscoped.select('content_length').each {|file| sum += file.content_length }
    sum
  end
end
