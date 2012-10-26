class AddIndexToFileDownloads < ActiveRecord::Migration
  def change
    add_index :file_downloads, :user_id
    add_index :file_downloads, :deleted
  end
end
