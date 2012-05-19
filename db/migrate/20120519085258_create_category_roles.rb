class CreateCategoryRoles < ActiveRecord::Migration
  def change
    create_table :category_roles do |t|
      t.integer :category_id
      t.integer :role_id

      t.timestamps
    end
  end
end
