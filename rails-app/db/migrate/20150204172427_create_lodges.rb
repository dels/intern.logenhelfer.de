class CreateLodges < ActiveRecord::Migration
  def self.up
    create_table :lodges do |t|
      t.string :slug
      t.string :name
      t.text :description
      t.integer :district_id
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :lodges
  end
end
