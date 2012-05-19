class Role < ActiveRecord::Base
  attr_accessible :description, :name, :display_name

  validates_presence_of :name, :display_name

  has_many :user_roles

  has_many :category_roles
  has_many :categories, :through => :category_roles

end
