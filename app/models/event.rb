class Event < ActiveRecord::Base
  attr_accessible :title, :public_description, :private_description,
      :date, :time, :duration, :whole_day

  default_scope where(deleted: false).order('date ASC')

  validates_presence_of :date, :title, :created_by_id
  validates_presence_of :time,                          unless: :whole_day?

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User'

  def end_time
    self.time + self.duration.minutes
  end

  def to_s
    title
  end
end
