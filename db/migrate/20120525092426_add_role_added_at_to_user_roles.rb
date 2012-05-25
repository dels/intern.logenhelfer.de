class AddRoleAddedAtToUserRoles < ActiveRecord::Migration
  def change
    add_column :user_roles, :role_added_at, :date
  end
end
