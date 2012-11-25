class MigrateFileDownloadFilename < ActiveRecord::Migration
  def up
    FileDownload.all.each do |fd|
      fd.filename = fd.attached_file.filename
      fd.save!
    end
  end

  def down
  end
end
