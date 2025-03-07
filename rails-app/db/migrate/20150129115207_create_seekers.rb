class CreateSeekers < ActiveRecord::Migration
  def self.up
    create_table :seekers do |t|
      t.string :firstname
      t.string :lastname
      t.string :source
      t.string :preferred_way_of_contact
      t.boolean :invite
      t.boolean :deleted, :default => :false
      t.timestamps
    end
  end

  def self.down
    drop_table :seekers
  end
end
