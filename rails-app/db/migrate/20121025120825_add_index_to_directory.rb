class AddIndexToDirectory < ActiveRecord::Migration
  def change
    add_index :directories, :category_id
    add_index :directories, :deleted
  end
end
