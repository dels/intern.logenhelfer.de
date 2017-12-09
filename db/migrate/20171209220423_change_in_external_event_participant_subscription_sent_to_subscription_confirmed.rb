class ChangeInExternalEventParticipantSubscriptionSentToSubscriptionConfirmed < ActiveRecord::Migration
  def change
    rename_column :external_event_participants, :subscription_sent, :subscription_confirmed
  end
end
