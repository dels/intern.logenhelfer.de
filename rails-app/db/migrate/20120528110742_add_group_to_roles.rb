class AddGroupToRoles < ActiveRecord::Migration
  def change
    add_column :roles, :group, :boolean, :default => false
  end
end
