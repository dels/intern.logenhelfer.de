class Role < ActiveRecord::Base
  attr_accessible :description, :name

  has_many :user_roles
end
