class CreateExternalEventParticipants < ActiveRecord::Migration
  def change
    create_table :external_event_participants do |t|
      t.integer :user_id
      t.integer :external_event_id
      t.boolean :subscription_sent, :default => false

      t.timestamps
    end
  end
end
