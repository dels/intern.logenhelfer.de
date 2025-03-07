class AddNotesToSeekers < ActiveRecord::Migration
  def change
    add_column :seekers, :notes, :text
  end
end
