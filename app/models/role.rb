class Role < ActiveRecord::Base
  attr_accessible :description, :name

  has_many :user_roles

  has_many :cateogy_roles
  has_many :categories, :through => :cateogy_roles


end
