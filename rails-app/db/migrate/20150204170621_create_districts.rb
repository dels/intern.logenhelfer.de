class CreateDistricts < ActiveRecord::Migration
  def self.up
    create_table :districts do |t|
      t.string :slug
      t.string :name
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :districts
  end
end
