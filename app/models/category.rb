class Category < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name, use: :slugged

  attr_accessible :name, :description, :roles, :role_ids

  validates_presence_of :name
  validates_uniqueness_of :name

  has_many :directories

  has_many :category_roles
  has_many :roles, :through => :category_roles

  default_scope where(:deleted => false) unless (Rails.env.archive? || Rails.env.archive_dev?)

  def delete
    if AppConfig[:archive]
      self.deleted = false
    else
      self.deleted = true
      self.directories.all.each {|dir| dir.delete}
    end
    self.save
  end
end
