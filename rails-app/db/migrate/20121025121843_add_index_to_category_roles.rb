class AddIndexToCategoryRoles < ActiveRecord::Migration
  def change
    add_index :category_roles, :category_id
    add_index :category_roles, :role_id
  end
end
