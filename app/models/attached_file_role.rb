class AttachedFileRole < ActiveRecord::Base
  attr_accessible :attached_file_id, :role_id

  belongs_to :attached_file
  belongs_to :role
end
