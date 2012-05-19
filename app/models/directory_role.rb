class DirectoryRole < ActiveRecord::Base
  attr_accessible :directory_id, :role_id

  
  has_many :directory_roles
  has_many :roles, :through => :directory_roles
  
end
