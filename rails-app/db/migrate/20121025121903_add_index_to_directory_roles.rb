class AddIndexToDirectoryRoles < ActiveRecord::Migration
  def change
    add_index :directory_roles, :directory_id
    add_index :directory_roles, :role_id
  end
end
