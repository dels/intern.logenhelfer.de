class AcademicTitle < ApplicationRecord

  has_many :users

  validates_presence_of :short

  default_scope { order('short ASC') }
  scope :undeleted, -> { where(deleted: false) }
  scope :deleted, -> { where(deleted: true) }

  def to_s
    short
  end
end
