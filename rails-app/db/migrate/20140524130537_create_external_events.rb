class CreateExternalEvents < ActiveRecord::Migration
  def self.up
    create_table :external_events do |t|
      t.string :uuid, :length => 36
      t.string :title, :null => false
      t.string :description
      t.string :location, :null => false
      t.time :time,:null => false
      t.date :date, :null => false
      t.integer :created_by_id, :null => false
      t.integer :updated_by_id
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :external_events
  end
end
