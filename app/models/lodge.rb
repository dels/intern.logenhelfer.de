class Lodge < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name, use: :slugged

  validates_presence_of :name, :district_id

  belongs_to :district

  has_many :officers

  default_scope { where(:deleted => false) }
end
