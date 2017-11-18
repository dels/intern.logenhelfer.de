class AttachedFileRole < ActiveRecord::Base

  belongs_to :attached_file
  belongs_to :role
end
