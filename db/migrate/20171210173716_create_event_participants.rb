class CreateEventParticipants < ActiveRecord::Migration
  def change
    create_table :event_participants do |t|
      t.integer :user_id
      t.integer :event_id
      t.boolean :festive_board, :default => false
      t.boolean :subscription_confirmed, :default => false
      t.timestamps null: false
    end
  end
end
