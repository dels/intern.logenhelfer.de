class AddAdministrationalRoleToRoles < ActiveRecord::Migration
  def change
    add_column :roles, :administrational_role, :bool, :default => true
  end
end
