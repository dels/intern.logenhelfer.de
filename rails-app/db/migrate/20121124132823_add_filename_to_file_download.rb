class AddFilenameToFileDownload < ActiveRecord::Migration
  def up
    add_column :file_downloads, :filename, :string
  end

  def down
    remove_column :file_downloads, :filename
  end

end
