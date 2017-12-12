class Event < ApplicationRecord

  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  default_scope { where(deleted: false).order('date ASC') }

  validates_presence_of :date, :title, :created_by_id
  validates_presence_of :time,                          unless: :whole_day?

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User', optional: true

  has_many :event_participants
  has_many :participants, :through => :event_participants, :source => :user

  default_scope { where(:deleted => false) } 
  
  attr_accessor :target

  def to_s
    title
  end

  TYPES = [:birthday]
  TYPES.each do |t|
    define_method("#{t}?") { @event_type == t }
    define_method("#{t}!") { @event_type =  t }
  end

  def event_type
    classes = []
    classes << 'whole-day'            if self.whole_day?
    classes << "type-#{@event_type}"  if @event_type.present?
    classes.join(' ')
  end

  def target
    return @target if @event_type.present?
    self
  end

  def ical_date(date, &block)
    _d = date.to_datetime.in_time_zone(Time.zone)
    _d = yield _d if block_given?
    #_d.in_time_zone('UTC').tap {|d| d.icalendar_tzid = 'UTC' }
    _d
  end

  def ical_event(calendar=nil)
    calendar          ||= Icalendar::Calendar.new

    event               = calendar.event
    event.summary       = title
    event.description   = public_description
    event.uid           = "#{uuid}@#{AppConfig[:domain]}"
    event.transp        = 'TRANSPARENT'

    event.dtstamp       = ical_date created_at
    event.last_modified = ical_date updated_at if updated_at.present? && created_at != updated_at
    if whole_day?
      event.dtstart     = ical_date(date) {|d| d.beginning_of_day }
      event.dtend       = ical_date(date) {|d| d.end_of_day }
    else
      event.dtstart     = ical_date(date) {|d| d.change(hour: time.hour, min: time.min) }
      event.dtend     = ical_date(date) {|d| d.change(hour: time.hour + 1, min: time.min) }
    end

    calendar
  end

  def to_ical(calendar=nil)
    ical_event(calendar).to_ical
  end

  def self.icalendar from, to
    cal = Icalendar::Calendar.new

    where('date >= ? AND date <= ?', from, to).order('date ASC, whole_day ASC, time ASC').each do |event|
      next if event.public_description.blank?
      event.ical_event(cal)
    end
    cal.to_ical
  end


  def subscription(usr)
    EventParticipant.where(event_id: self.id).where(user_id: usr.id).first
  end

  def subscription_confirmed?(usr)
    participants = EventParticipant.where(:user_id => usr.id).where(:event_id => self.id)
    if participants.empty?
      Rails.logger.warn("asked for subscription confirmed, but not subscribed (user_id: #{usr.id}. event_id: #{self.id})")
      return false
    end
    if participants.count != 1
      Rails.logger.warn("found more than one participants (user_id: #{usr.id}. event_id: #{self.id})")
      return false
    end
    participants.first.subscription_confirmed?
  end

  def to_s
    title
  end
  
end
