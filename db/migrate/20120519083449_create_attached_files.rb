class CreateAttachedFiles < ActiveRecord::Migration
  def self.up
    create_table :attached_files do |t|
      t.string :uuid, :limit => 36
      t.string :filename
      t.binary :content
      t.string :content_type
      t.integer :directory_id
      t.integer :uploader_id
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :attached_files
  end
end
