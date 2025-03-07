class CreateDirectoryRoles < ActiveRecord::Migration
  def change
    create_table :directory_roles do |t|
      t.integer :directory_id
      t.integer :role_id

      t.timestamps
    end
  end
end
