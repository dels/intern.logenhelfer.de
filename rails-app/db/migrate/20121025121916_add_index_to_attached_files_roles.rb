class AddIndexToAttachedFilesRoles < ActiveRecord::Migration
  def change
    add_index :attached_file_roles, :attached_file_id
    add_index :attached_file_roles, :role_id
  end
end
