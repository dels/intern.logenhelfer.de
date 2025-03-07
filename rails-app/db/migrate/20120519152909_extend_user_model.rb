class ExtendUserModel < ActiveRecord::Migration
  def up
    add_column :users, :uuid, :string, :length => 36
    
    add_column :users, :firstname, :string
    add_column :users, :lastname, :string 
    add_column :users, :date_of_birth, :date 
    add_column :users, :included_at, :date 
    add_column :users, :accepted_at, :date
  end

  def down
    remove_column :users, :uuid, :string, :length => 36
    remove_column :users, :firstname, :string
    remove_column :users, :lastname, :string 
    remove_column :users, :date_of_birth, :date 
    remove_column :users, :included_at, :date 
    remove_column :users, :accepted_at, :date
  end
end
