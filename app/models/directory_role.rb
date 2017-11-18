class DirectoryRole < ActiveRecord::Base
  
  belongs_to :directory
  belongs_to :role
end
