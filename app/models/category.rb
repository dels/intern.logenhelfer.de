class Category < ActiveRecord::Base
  attr_accessible :name, :description

  has_many :directories

  has_many :cateogy_roles
  has_many :roles, :through => :cateogy_roles

  default_scope where(:deleted => false)
end
