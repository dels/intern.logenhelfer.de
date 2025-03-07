class AddStatusToSeekers < ActiveRecord::Migration
  def change
    add_column :seekers, :status, :integer
  end
end
