class MigrateFileDownloadFilename < ActiveRecord::Migration
  def up
    FileDownload.all.each do |fd|
      next unless fd.attached_file
      fd.filename = fd.attached_file.filename
      fd.save!
    end
  end

  def down
  end
end
