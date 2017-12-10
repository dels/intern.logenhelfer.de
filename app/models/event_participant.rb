class EventParticipant < ActiveRecord::Base

  belongs_to :user
  belongs_to :event

  validates_presence_of :user
  validates_presence_of :event
  validates_uniqueness_of :user_id, :scope => :event_id

end
