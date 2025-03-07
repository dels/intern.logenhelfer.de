class RemoveIncludedAtFromUsers < ActiveRecord::Migration
  def up
    remove_column :users, :included_at
      end

  def down
    add_column :users, :included_at, :date
  end
end
