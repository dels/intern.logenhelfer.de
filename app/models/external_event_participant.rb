class ExternalEventParticipant < ActiveRecord::Base
  
  belongs_to :user
  belongs_to :external_event

  after_create :announce_new_subscription

  validates_presence_of :user
  validates_presence_of :external_event
  validates_uniqueness_of :user_id, :scope => :external_event_id

  def announce_new_subscription
    UserMailer.new_subscription_notification(self.external_event, self.user).deliver
  end

end
