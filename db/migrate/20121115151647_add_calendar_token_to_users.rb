class AddCalendarTokenToUsers < ActiveRecord::Migration
  def change
    add_column :users, :calendar_token, :string
    add_index :users, :calendar_token
  end
end
