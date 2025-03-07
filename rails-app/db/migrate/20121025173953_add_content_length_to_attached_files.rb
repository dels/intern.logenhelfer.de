class AddContentLengthToAttachedFiles < ActiveRecord::Migration
  def change
    add_column :attached_files, :content_length, :integer, :default => -1
  end
end
