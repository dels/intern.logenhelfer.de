class Directory < ActiveRecord::Base
  attr_accessible :name, :description, :category_id

  has_many :attached_files
  belongs_to :category

  default_scope where(:deleted => false)
end
