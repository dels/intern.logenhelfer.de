class Event < ActiveRecord::Base
  attr_accessible :title, :public_description, :private_description,
      :date, :time, :whole_day, :location

  include UuidHelper
  before_create :generate_uuid

  default_scope where(deleted: false).order('date ASC')

  validates_presence_of :date, :title, :created_by_id
  validates_presence_of :time,                          unless: :whole_day?

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User'

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

  def self.icalendar from, to
    cal = Icalendar::Calendar.new

    where('date >= ? AND date <= ?', from, to).order('date ASC, whole_day ASC, time ASC').each do |e|
      next if e.public_description.blank?
      event               = cal.event
      event.summary       = e.title
      event.description   = e.public_description
      event.uid           = "#{e.uuid}@#{AppConfig[:domain]}"
      event.transp        = 'TRANSPARENT'

      event.dtstamp       = e.created_at.to_datetime
      event.last_modified = e.updated_at.to_datetime if e.updated_at.present? && e.created_at != e.updated_at
      if e.whole_day?
        event.dtstart     = e.date.to_datetime.beginning_of_day
        event.dtend       = e.date.to_datetime.end_of_day
      else
        event.dtstart     = e.date.to_datetime.change hour: e.time.hour, min: e.time.min
      end
    end

    cal.to_ical
  end
end
