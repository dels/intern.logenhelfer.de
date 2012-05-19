class Category < ActiveRecord::Base
  attr_accessible :name, :description

  has_many :directories

  has_many :category_roles
  has_many :roles, :through => :category_roles

  default_scope where(:deleted => false)
end
