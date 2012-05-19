class Directory < ActiveRecord::Base
  attr_accessible :name, :description, :category_id

  belongs_to :category

  has_many :attached_files
  has_many :directory_roles
  has_many :roles, :through => :directory_roles

  default_scope where(:deleted => false)
end
