class AddFilenameToFileDownload < ActiveRecord::Migration
  def up
    add_column :file_downloads, :filename, :string
    FileDownload.all.each do |fd|
      fd.filename = fd.attached_file.filename
      fd.save!
    end
  end

  def down
    remove_column :file_downloads, :filename
  end

end
