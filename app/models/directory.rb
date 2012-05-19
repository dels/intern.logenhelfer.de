class Directory < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name

  attr_accessible :name, :description, :category_id, :role_ids

  validates_presence_of :name
  validates_uniqueness_of :name

  belongs_to :category

  has_many :attached_files
  has_many :directory_roles
  has_many :roles, :through => :directory_roles

  default_scope where(:deleted => false)
end
