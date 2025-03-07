class ChangeWayOfContact < ActiveRecord::Migration
  def up
    remove_column :seekers, :preferred_way_of_contact
    add_column :seekers, :preferred_way_of_contact, :integer
  end

  def down
    remove_column :seekers, :preferred_way_of_contact
    add_column :seekers, :preferred_way_of_contact, :string
  end
end
