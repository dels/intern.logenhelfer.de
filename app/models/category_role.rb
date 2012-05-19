class CategoryRole < ActiveRecord::Base
  attr_accessible :category_id, :role_id

  belongs_to :category
  belongs_to :role

end
