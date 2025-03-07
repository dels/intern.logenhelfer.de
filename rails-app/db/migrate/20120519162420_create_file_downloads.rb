class CreateFileDownloads < ActiveRecord::Migration
  def self.up
    create_table :file_downloads do |t|
      t.integer :attached_file_id
      t.integer :user_id
      t.string :remote_ip
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :file_downloads
  end
end
