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
    ExternalEventParticipant.where(:user_id => usr.id).first
  end

  def subscribed?(usr)
    false == ExternalEventParticipant.where(:user_id => usr.id).where(:external_event_id => self.id).empty?
  end

  def subscription_sent?(usr)
    (subscribed?(usr) && true == ExternalEventParticipant.where(:user_id => usr.id).first.subscription_sent)
  end

  def to_s
    title
  end
end
