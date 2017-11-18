class CategoryRole < ActiveRecord::Base

  belongs_to :category
  belongs_to :role

end
