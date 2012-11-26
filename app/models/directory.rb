class Directory < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name, use: :slugged

  attr_accessible :name, :description, :category_id, :role_ids, :roles, :category

  validates_presence_of :name
  validates_uniqueness_of :name

  belongs_to :category

  has_many :attached_files
  has_many :directory_roles
  has_many :roles, :through => :directory_roles

  default_scope where(:deleted => false) unless (Rails.env.archive? || Rails.env.archive_dev?)

  def delete
    if AppConfig[:archive]
      self.deleted = false
      self.category.delete
    else
      self.deleted = true
      self.attached_files.all.each {|f| f.delete}
    end
    self.save
  end
end
