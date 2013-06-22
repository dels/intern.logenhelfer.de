class AddMotherLodgeToUser < ActiveRecord::Migration
  def change
    add_column :users, :mother_lodge, :string
  end
end
