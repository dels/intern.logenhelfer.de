class DirectoryRole < ActiveRecord::Base
  attr_accessible :directory_id, :role_id

  
  belongs_to :directory
  belongs_to :role
end
