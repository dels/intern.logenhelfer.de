class CategoryRole < ActiveRecord::Base
  attr_accessible :category_id, :role_id

  belongs_to :categories
  belongs_to :roles
end
