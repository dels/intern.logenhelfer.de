class CreateAnnouncements < ActiveRecord::Migration
  def self.up
    create_table :announcements do |t|
      t.string :uuid
      t.string :title
      t.text :message_body
      t.references :created_by
      t.references :updated_by
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :announcements
  end
end
