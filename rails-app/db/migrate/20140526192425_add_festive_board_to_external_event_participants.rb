class AddFestiveBoardToExternalEventParticipants < ActiveRecord::Migration
  def change
    add_column :external_event_participants, :festive_board, :boolean, :default => false
  end
end
