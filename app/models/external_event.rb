class ExternalEvent < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  validates_presence_of :title, :host, :time, :date

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User'


  has_many :external_event_participants
  has_many :participants, :through => :external_event_participants, :source => :user

  default_scope { where(:deleted => false) } 

  def subscription(usr)
    ExternalEventParticipant.where(external_event_id: self.id).where(user_id: usr.id).first
  end

  def subscription_confirmed?(usr)
    participants = ExternalEventParticipant.where(:user_id => usr.id).where(:external_event_id => self.id)
    if participants.empty?
      Rails.logger.warn("asked for subscription confirmed, but not subscribed (user_id: #{usr.id}. external_event_id: #{self.id})")
      return false
    end
    if participants.count != 1
      Rails.logger.warn("found more than one participants (user_id: #{usr.id}. external_event_id: #{self.id})")
      return false
    end
    participants.first.subscription_confirmed?
  end

  def to_s
    title
  end
end
