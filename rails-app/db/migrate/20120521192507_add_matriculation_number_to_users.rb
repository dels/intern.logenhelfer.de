class AddMatriculationNumberToUsers < ActiveRecord::Migration
  def change
    add_column :users, :matriculation_number, :integer
  end
end
