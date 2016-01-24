class ExternalEventParticipant < ActiveRecord::Base
  
  belongs_to :user
  belongs_to :external_event

  validates_presence_of :user
  validates_presence_of :external_event
  validates_uniqueness_of :user_id, :scope => :external_event_id

end
