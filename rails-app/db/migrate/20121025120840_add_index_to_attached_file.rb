class AddIndexToAttachedFile < ActiveRecord::Migration
  def change
    add_index :attached_files, :directory_id
    add_index :attached_files, :filename
    add_index :attached_files, :deleted
  end
end
