class CreateOfficers < ActiveRecord::Migration
  def self.up
    create_table :officers do |t|
      t.string :uuid
      t.integer :lodge_id
      t.string :firstname
      t.string :lastname
      t.integer :role_id
      t.string :role_email
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :officers
  end
end
