class AddUuidToEvents < ActiveRecord::Migration
  def change
    add_column :events, :uuid, :string, limit: 36, unique: true
  end
end
