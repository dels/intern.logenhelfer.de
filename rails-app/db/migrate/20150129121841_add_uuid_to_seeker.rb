class AddUuidToSeeker < ActiveRecord::Migration
  def change
    add_column :seekers, :uuid, :string, limit: 36
  end
end
