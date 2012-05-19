class CreateAttachedFileRoles < ActiveRecord::Migration
  def change
    create_table :attached_file_roles do |t|
      t.integer :attached_file_id
      t.integer :role_id

      t.timestamps
    end
  end
end
