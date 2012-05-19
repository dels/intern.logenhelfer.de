class Category < ActiveRecord::Base
  attr_accessible :name, :description

  extend FriendlyId
  friendly_id :name

  validates_presence_of :name
  validates_uniqueness_of :name

  has_many :directories

  has_many :category_roles
  has_many :roles, :through => :category_roles

  default_scope where(:deleted => false)
end
